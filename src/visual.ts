
"use strict";

import powerbi from "powerbi-visuals-api";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataViewObjects = powerbi.DataViewObjects;

import "./../style/visual.less";

export class Visual implements IVisual {
    private target: HTMLElement;
    private textarea: HTMLTextAreaElement;
    private button: HTMLButtonElement;
    private clearButton: HTMLButtonElement;
    private cancelButton: HTMLButtonElement;

    private statusOutput: HTMLDivElement;
    private resultOutput: HTMLDivElement;
    private debugOutput: HTMLDivElement;

    private host: IVisualHost;
    private abortController?: AbortController;

    public apiKey: string = "";
    public assistantId: string = "";
    public modelo: string = "";
    public debug: string = "true";
    public fontSize: number = 14;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;

        const container = document.createElement("div");
        container.className = "chat-container";

        this.textarea = document.createElement("textarea");
        this.textarea.className = "chat-input";
        this.textarea.placeholder = "Digite sua pergunta...";
        this.textarea.rows = 1;
        this.textarea.addEventListener("input", () => {
            this.textarea.style.height = "auto";
            this.textarea.style.height = this.textarea.scrollHeight + "px";
        });

        this.button = document.createElement("button");
        this.button.textContent = "Perguntar";

        this.clearButton = document.createElement("button");
        this.clearButton.textContent = "Limpar";
        this.clearButton.onclick = () => {
            this.textarea.value = "";
            this.clearLogs("status");
            this.clearLogs("result");
            this.clearLogs("debug");
        };

        this.cancelButton = document.createElement("button");
        this.cancelButton.textContent = "Interromper";
        this.cancelButton.disabled = true;
        this.cancelButton.onclick = () => {
            if (this.abortController) {
                this.abortController.abort();
                this.cancelButton.disabled = true;
                this.button.disabled = false;
                this.logOutput("⛔ Requisição cancelada pelo usuário.", "status");
            }
        };

        const buttonGroup = document.createElement("div");
        buttonGroup.className = "chat-buttons";
        buttonGroup.appendChild(this.button);
        buttonGroup.appendChild(this.cancelButton);
        buttonGroup.appendChild(this.clearButton);

        this.statusOutput = document.createElement("div");
        this.statusOutput.className = "chat-status";

        this.resultOutput = document.createElement("div");
        this.resultOutput.className = "chat-result";

        this.debugOutput = document.createElement("div");
        this.debugOutput.className = "chat-debug";

        container.appendChild(this.textarea);
        container.appendChild(buttonGroup);
        container.appendChild(this.statusOutput);
        container.appendChild(this.resultOutput);
        container.appendChild(this.debugOutput);

        this.target.appendChild(container);

        this.button.onclick = async () => {
            this.button.disabled = true;
            this.cancelButton.disabled = false;
            this.abortController = new AbortController();

            if (!this.textarea || !this.apiKey || !this.assistantId || !this.modelo) {
                this.logOutput("Preencha todos os campos no painel de formatação.", "status");
                this.button.disabled = false;
                this.cancelButton.disabled = true;
                return;
            }

            this.clearLogs("status");
            this.logOutput("⏳ Criando nova thread...", "status");

            try {
                const threadResp = await fetch("https://api.openai.com/v1/threads", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                        "OpenAI-Beta": "assistants=v2"
                    },
                    signal: this.abortController.signal
                });
                const threadData = await threadResp.json();
                const threadId = threadData.id;

                this.logOutput("📤 Enviando pergunta...", "status");
                if (this.debug == "true") this.logOutput("Thread ID: " + threadId, "debug");

                await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                        "OpenAI-Beta": "assistants=v2"
                    },
                    body: JSON.stringify({ role: "user", content: this.textarea.value }),
                    signal: this.abortController.signal
                });

                const runResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                        "OpenAI-Beta": "assistants=v2"
                    },
                    body: JSON.stringify({ assistant_id: this.assistantId }),
                    signal: this.abortController.signal
                });

                const runData = await runResp.json();
                const runId = runData.id;
                let runStatus = "";
                let attempts = 0;
                do {
                    const statusResp = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
                        headers: {
                            "Authorization": `Bearer ${this.apiKey}`,
                            "OpenAI-Beta": "assistants=v2"
                        },
                        signal: this.abortController.signal
                    });

                    const statusData = await statusResp.json();
                    runStatus = statusData.status;
                    if (runStatus !== "completed") await new Promise(resolve => setTimeout(resolve, 1500));
                    attempts++;
                } while (runStatus !== "completed" && attempts < 20);

                const msgRespFinal = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "OpenAI-Beta": "assistants=v2"
                    },
                    signal: this.abortController.signal
                });

                const finalData = await msgRespFinal.json();
                const lastMessage = finalData.data.reverse().find((m: any) => m.role === "assistant");
                this.clearLogs("status");
                this.logOutput(lastMessage?.content[0]?.text?.value || "Sem resposta.", "result");
            } catch (error) {
                if (error.name === "AbortError") {
                    this.logOutput("⛔ Requisição cancelada.", "status");
                } else {
                    this.logOutput("❌ Erro ao processar a requisição.", "result");
                    this.logOutput(error.message, "debug");
                }
            } finally {
                this.abortController = undefined;
                this.cancelButton.disabled = true;
                this.button.disabled = false;
            }
        };
    }

    private logOutput(text: string, type: "status" | "result" | "debug") {
        const p = document.createElement("pre");
        p.style.margin = "0";
        p.style.setProperty("font-size", `${this.fontSize}px`, "important");
        p.style.lineHeight = "1.3em";
        p.innerText = text;

        if (type === "status") {
            this.statusOutput.innerHTML = "";
            this.statusOutput.appendChild(p);
        } else if (type === "result") {
            this.resultOutput.appendChild(p);
        } else if (type === "debug" && this.debug === "true") {
            this.debugOutput.appendChild(p);
        }
    }

    private clearLogs(type: "status" | "result" | "debug") {
        if (type === "status") this.statusOutput.innerHTML = "";
        if (type === "result") this.resultOutput.innerHTML = "";
        if (type === "debug") this.debugOutput.innerHTML = "";
    }

    public update(options: VisualUpdateOptions) {
        const objects = options.dataViews[0]?.metadata?.objects;
        if (objects) {
            this.debug = getValue(objects, "apiSettings", "debug", "true");
            this.apiKey = getValue(objects, "apiSettings", "openAiKey", "");
            this.modelo = getValue(objects, "apiSettings", "modelo", "");
            this.assistantId = getValue(objects, "apiSettings", "assistantId", "");
            this.fontSize = getValue(objects, "apiSettings", "fontSize", 14);

            if (this.textarea) {
                this.textarea.style.setProperty("font-size", `${this.fontSize}px`, "important");
            }

            const allTextElements = this.target.querySelectorAll("*");
            allTextElements.forEach(el => {
                const tag = el.tagName.toLowerCase();
                if (["p", "pre", "div", "span", "button", "label"].includes(tag)) {
                    (el as HTMLElement).style.setProperty("font-size", `${this.fontSize}px`, "important");
                }
            });
        }
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
        const instances: VisualObjectInstance[] = [];

        if (options.objectName === "apiSettings") {
            instances.push({
                objectName: options.objectName,
                properties: {
                    debug: this.debug,
                    openAiKey: this.apiKey,
                    modelo: this.modelo,
                    assistantId: this.assistantId,
                    fontSize: this.fontSize
                },
                selector: null
            });
        }

        return instances;
    }
}

function getValue<T>(objects: DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T {
    return (objects?.[objectName]?.[propertyName] as T) ?? defaultValue;
}
