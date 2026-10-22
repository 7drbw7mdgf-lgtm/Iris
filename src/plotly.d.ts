declare module "plotly.js-dist-min" {
  const Plotly: {
    react: (el: HTMLElement, data: any[], layout?: any, config?: any) => Promise<void>;
    newPlot: (el: HTMLElement, data: any[], layout?: any, config?: any) => Promise<void>;
    purge: (el: HTMLElement) => void;
    Plots: { resize: (el: HTMLElement) => void };
  };
  export default Plotly;
}
