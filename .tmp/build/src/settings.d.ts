import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
export declare class VisualSettings extends DataViewObjectsParser {
    apiSettings: ApiSettings;
}
export declare class ApiSettings {
    openAiKey: string;
    assistantId: string;
    debug: string;
    modelo: string;
    fontSize: number;
}
