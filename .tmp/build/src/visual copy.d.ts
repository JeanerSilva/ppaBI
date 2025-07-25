import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import "./../style/visual.less";
export declare class Visual implements IVisual {
    private target;
    private textarea;
    private button;
    private clearButton;
    private cancelButton;
    private statusOutput;
    private resultOutput;
    private debugOutput;
    private host;
    private abortController?;
    apiKey: string;
    assistantId: string;
    modelo: string;
    debug: string;
    fontSize: number;
    constructor(options: VisualConstructorOptions);
    private logOutput;
    private clearLogs;
    update(options: VisualUpdateOptions): void;
    enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[];
}
