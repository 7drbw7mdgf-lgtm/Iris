import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { hitPythonArtist } from "../src/artistHit.ts";
import { pythonArtistOverrideCode, stripPythonArtistOverrides } from "../src/pythonArtistOverrides.ts";

test("hits lines and patches but skips hidden artists", () => {
  const artists = [
    { key: "0:line:0", kind: "line", visible: true, bbox: [0, 0, 1, 1], points: [[0.1, 0.1], [0.9, 0.9]] },
    { key: "0:patch:0", kind: "patch", visible: true, bbox: [0.7, 0.1, 0.1, 0.1], points: [] },
    { key: "0:patch:1", kind: "patch", visible: false, bbox: [0.2, 0.8, 0.2, 0.1], points: [] },
  ];
  assert.equal(hitPythonArtist(artists, 50, 50, 100, 100)?.key, "0:line:0");
  assert.equal(hitPythonArtist(artists, 75, 15, 100, 100)?.key, "0:patch:0");
  assert.equal(hitPythonArtist(artists, 25, 85, 100, 100), null);
});

test("artist override code is scoped and replaceable", () => {
  const code = pythonArtistOverrideCode({
    "0:line:0": { visible: false, color: "#ff0000" },
    "not-an-artist": { visible: false },
  });
  assert.match(code, /0:line:0/);
  assert.doesNotMatch(code, /not-an-artist/);
  assert.equal(stripPythonArtistOverrides("fig = 1" + code).trim(), "fig = 1");
});

test("custom artist property override updates the Matplotlib object", { skip: !process.env.IRIS_PYTHON }, () => {
  const override = pythonArtistOverrideCode({ "0:artist:0": { properties: { temperature: 3.75 } } });
  const source = `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.artist import Artist
class CustomMark(Artist):
    def __init__(self):
        super().__init__()
        self._temperature = 1.5
    def get_temperature(self):
        return self._temperature
    def set_temperature(self, value):
        self._temperature = value
fig, ax = plt.subplots()
mark = CustomMark()
ax.add_artist(mark)
${override}
print(mark.get_temperature())`;
  const result = spawnSync(process.env.IRIS_PYTHON, ["-c", source], { encoding: "utf8", env: { ...process.env, MPLCONFIGDIR: "/tmp/iris-test-mplconfig" } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "3.75");
});

test("collection cmap and clim overrides update matplotlib collection", { skip: !process.env.IRIS_PYTHON }, () => {
  const override = pythonArtistOverrideCode({ "0:collection:0": { cmap: "plasma", vmin: 0.1, vmax: 0.9 } });
  const source = `import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
fig, ax = plt.subplots()
coll = ax.scatter([1, 2, 3], [4, 5, 6], c=[0.2, 0.5, 0.8], cmap="viridis")
${override}
print(coll.get_cmap().name)
print(f"{coll.get_clim()[0]:.1f},{coll.get_clim()[1]:.1f}")`;
  const result = spawnSync(process.env.IRIS_PYTHON, ["-c", source], { encoding: "utf8", env: { ...process.env, MPLCONFIGDIR: "/tmp/iris-test-mplconfig" } });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /plasma/);
  assert.match(result.stdout, /0\.1,0\.9/);
});
