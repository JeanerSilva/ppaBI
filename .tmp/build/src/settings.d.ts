import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
export declare class VisualSettings extends DataViewObjectsParser {
    apiSettings: ApiSettings;
}
export declare class ApiSettings {
    nome: string;
    openAiKey: string;
    systemPrompt: string;
}
