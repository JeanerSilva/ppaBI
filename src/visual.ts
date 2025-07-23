
"use strict";

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;

import { VisualSettings } from "./settings";

export class Visual implements IVisual {
    private container: HTMLElement;
    private output: HTMLElement;
    private settings: VisualSettings;
    private apiKey: string = "";
    private assistantId: string = "";
    private threadId: string = "";

    constructor(options: VisualConstructorOptions) {
        this.container = document.createElement("div");
        this.container.style.padding = "8px";
        this.container.style.fontFamily = "Segoe UI, sans-serif";

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Pergunte ao assistente com arquivos...";
        input.style.width = "300px";
        input.style.padding = "4px";
        input.style.border = "1px solid #ccc";
        input.style.borderRadius = "3px";

        const button = document.createElement("button");
        button.innerText = "Enviar";
        button.style.marginLeft = "8px";
        button.style.padding = "5px 10px";
        button.style.border = "none";
        button.style.borderRadius = "3px";
        button.style.backgroundColor = "#444";
        button.style.color = "white";

        this.output = document.createElement("div");
        this.output.style.marginTop = "10px";
        this.output.style.whiteSpace = "pre-wrap";
        this.output.style.backgroundColor = "#f0f0f0";
        this.output.style.padding = "10px";
        this.output.style.border = "1px solid #ccc";
        this.output.style.borderRadius = "3px";

        button.onclick = async () => {
            const pergunta = input.value.trim();
            if (!pergunta || !this.apiKey || !this.assistantId || !this.threadId) {
                this.output.innerText = "Preencha todos os campos no painel de formatação.";
                return;
            }

            this.output.innerText = "Consultando o assistente...";

            try {
                await fetch(`https://api.openai.com/v1/threads/${this.threadId}/messages`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        role: "user",
                        content: pergunta
                    })
                });

                const runResp = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/runs`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        assistant_id: this.assistantId
                    })
                });
                const runData = await runResp.json();

                let status = "queued";
                while (status !== "completed" && status !== "failed") {
                    await new Promise(r => setTimeout(r, 1500));
                    const check = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/runs/${runData.id}`, {
                        headers: { "Authorization": `Bearer ${this.apiKey}` }
                    });
                    const res = await check.json();
                    status = res.status;
                }

                const msgResp = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/messages`, {
                    headers: { "Authorization": `Bearer ${this.apiKey}` }
                });
                const msgData = await msgResp.json();
                const resposta = msgData.data.find(m => m.role === "assistant")?.content?.[0]?.text?.value;
                this.output.innerText = resposta || "Sem resposta.";
            } catch (err) {
                console.error(err);
                this.output.innerText = "Erro ao consultar assistente.";
            }
        };

        this.container.appendChild(input);
        this.container.appendChild(button);
        this.container.appendChild(this.output);
        options.element.appendChild(this.container);
    }

    public update(options: VisualUpdateOptions) {
        this.settings = VisualSettings.parse<VisualSettings>(options.dataViews?.[0]);
        this.apiKey = this.settings.apiSettings.openAiKey || "";
        this.assistantId = this.settings.apiSettings.assistantId || "";
        this.threadId = this.settings.apiSettings.threadId || "";
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        const settings: VisualSettings = this.settings || new VisualSettings();
        if (options.objectName === "apiSettings") {
            return [{
                objectName: options.objectName,
                properties: {
                    openAiKey: settings.apiSettings.openAiKey,
                    assistantId: settings.apiSettings.assistantId,
                    threadId: settings.apiSettings.threadId
                },
                selector: null
            }];
        }
        return [];
    }
}
