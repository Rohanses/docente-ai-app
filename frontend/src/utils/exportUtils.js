import * as docx from 'docx';

// Conversión básica de Markdown a HTML simple para exportación
function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = markdown
        // Encabezados
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Negritas
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        // Saltos de línea
        .replace(/\n$/gim, '<br />')
        // Bloques de citas / Advertencias
        .replace(/^\> \[!IMPORTANT\]\s*(.*$)/gim, '<div style="background:#eff6ff; border-left:4px solid #2563eb; padding:10px; margin:10px 0;"><strong>IMPORTANTE:</strong> $1</div>')
        .replace(/^\> \[!WARNING\]\s*(.*$)/gim, '<div style="background:#fff7ed; border-left:4px solid #ea580c; padding:10px; margin:10px 0;"><strong>ADVERTENCIA:</strong> $1</div>')
        .replace(/^\> (.*$)/gim, '<blockquote style="border-left:4px solid #ccc; padding-left:10px; margin:10px 0; color:#555;">$1</blockquote>');

    // Procesar tablas de markdown (muy común en PDCs bolivianos)
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    let processedLines = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        if (line.startsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableHtml = '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse; width:100%; border:1px solid #cbd5e1; margin:15px 0; font-family:sans-serif; font-size:11pt;">';
            }
            
            // Ignorar líneas de separación |---|---|
            if (line.includes('---') || line.includes('===') || line.match(/^\|?\s*:?-+:?\s*\|/)) {
                continue;
            }
            
            const cells = line.split('|').slice(1, -1);
            const isHeader = !tableHtml.includes('<tbody>') && !line.includes('class="normal-row"');
            
            tableHtml += '<tr>';
            cells.forEach(cell => {
                const cellContent = cell.trim();
                if (isHeader) {
                    tableHtml += `<th style="background:#f1f5f9; font-weight:bold; border:1px solid #cbd5e1; text-align:left;">${cellContent}</th>`;
                } else {
                    tableHtml += `<td style="border:1px solid #cbd5e1;">${cellContent}</td>`;
                }
            });
            tableHtml += '</tr>';
        } else {
            if (inTable) {
                inTable = false;
                tableHtml += '</table>';
                processedLines.push(tableHtml);
                tableHtml = '';
            }
            processedLines.push(lines[i]);
        }
    }
    
    if (inTable) {
        tableHtml += '</table>';
        processedLines.push(tableHtml);
    }

    return processedLines.join('\n')
        .replace(/\n/g, '<br />')
        .replace(/(<br \/>){2,}/g, '</p><p>')
        .replace(/<p><\/p>/g, '');
}

/**
 * Convierte un objeto JSON estructurado a un texto plano en Markdown legible
 */
export function jsonToMarkdown(data) {
    if (!data) return "";
    
    // Verificar si es un PDC JSON
    if (data.datosReferenciales && data.estructuraPDC) {
        const { datosReferenciales, objetivoHolisticoNivel, estructuraPDC, adaptacionesSignificativas } = data;
        let md = `# PLAN DE DESARROLLO CURRICULAR (PDC)\n\n`;
        
        md += `## DATOS REFERENCIALES\n`;
        md += `- **Distrito Educativo:** ${datosReferenciales.distrito || ''}\n`;
        md += `- **Unidad Educativa:** ${datosReferenciales.unidadEducativa || ''}\n`;
        md += `- **Nivel:** ${datosReferenciales.nivel || ''}\n`;
        md += `- **Año de Escolaridad:** ${datosReferenciales.grado || ''}\n`;
        md += `- **Maestra/o:** ${datosReferenciales.maestro || ''}\n`;
        md += `- **Director/a:** ${datosReferenciales.director || ''}\n`;
        md += `- **Trimestre:** ${datosReferenciales.trimestre || ''}\n`;
        md += `- **Gestión / Fechas:** ${datosReferenciales.gestion || ''} (Del ${datosReferenciales.fechaInicio || ''} al ${datosReferenciales.fechaFin || ''})\n\n`;
        
        md += `## 1. OBJETIVO HOLÍSTICO DE NIVEL / DE APRENDIZAJE\n*${objetivoHolisticoNivel}*\n\n`;
        
        md += `## 2. DESARROLLO CURRICULAR Y PEDAGÓGICO\n\n`;
        
        (estructuraPDC.areas || []).forEach(area => {
            md += `### ÁREA: ${area.nombreArea.toUpperCase()}\n`;
            if (area.objetivoAprendizaje) {
                md += `- **Objetivo de Aprendizaje:** ${area.objetivoAprendizaje}\n`;
            }
            if (area.contenidos && area.contenidos.length > 0) {
                md += `- **Contenidos:** ${area.contenidos.join(", ")}\n`;
            }
            md += `\n`;
            
            if (estructuraPDC.tipo === 'directo') {
                const moments = area.momentosDirectos || {};
                const resources = area.recursosDirectos || {};
                const criteria = area.criteriosDirectos || {};
                
                md += `| Momentos del Proceso Formativo | Recursos/Materiales | Criterios de Evaluación |\n`;
                md += `| :--- | :--- | :--- |\n`;
                
                let momentsStr = `**Práctica:** ${moments.practica || ''}<br/>**Teoría:** ${moments.teoria || ''}<br/>**Valoración:** ${moments.valoracion || ''}<br/>**Producción:** ${moments.produccion || ''}`;
                let resourcesStr = `**Analógicos:** ${(resources.analogicos || []).join(", ")}<br/>**Producción:** ${(resources.produccion || []).join(", ")}<br/>**Vida:** ${(resources.vida || []).join(", ")}`;
                let criteriaStr = `**SER:** ${criteria.ser || ''}<br/>**SABER:** ${criteria.saber || ''}<br/>**HACER:** ${criteria.hacer || ''}<br/>**DECIDIR:** ${criteria.decidir || ''}`;
                
                md += `| ${momentsStr} | ${resourcesStr} | ${criteriaStr} |\n\n`;
            } else {
                md += `| Semana / Períodos | Momentos Metodológicos | Recursos | Criterios de Evaluación |\n`;
                md += `| :--- | :--- | :--- | :--- |\n`;
                
                (area.semanas || []).forEach(w => {
                    const moments = w.momentos || {};
                    const resources = w.recursos || {};
                    const criteria = w.criteriosEvaluacion || {};
                    
                    let wStr = `**Semana ${w.semana}**<br/>(${w.periodos || 8} períodos)`;
                    let momentsStr = `**Práctica:** ${moments.practica || ''}<br/>**Teoría:** ${moments.teoria || ''}<br/>**Valoración:** ${moments.valoracion || ''}<br/>**Producción:** ${moments.produccion || ''}`;
                    let resourcesStr = `**Analógicos:** ${(resources.analogicos || []).join(", ")}<br/>**Producción:** ${(resources.produccion || []).join(", ")}<br/>**Vida:** ${(resources.vida || []).join(", ")}`;
                    let criteriaStr = `**SER:** ${criteria.ser || ''}<br/>**SABER:** ${criteria.saber || ''}<br/>**HACER:** ${criteria.hacer || ''}<br/>**DECIDIR:** ${criteria.decidir || ''}`;
                    
                    md += `| ${wStr} | ${momentsStr} | ${resourcesStr} | ${criteriaStr} |\n`;
                });
                md += `\n`;
            }
            
            if (area.adaptacionesCurriculares) {
                md += `**Adaptaciones Curriculares (Generales):** ${area.adaptacionesCurriculares}\n\n`;
            }
        });
        
        if (adaptacionesSignificativas && adaptacionesSignificativas.length > 0) {
            md += `## 3. ADAPTACIONES CURRICULARES SIGNIFICATIVAS\n\n`;
            md += `| Estudiante | Dificultad / Discapacidad | Contenido | Adaptación | Criterio de Evaluación |\n`;
            md += `| :--- | :--- | :--- | :--- | :--- |\n`;
            
            adaptacionesSignificativas.forEach(st => {
                md += `| ${st.estudiante} | ${st.discapacidad} | ${st.contenido} | ${st.adaptacion} | ${st.criterioEvaluacion} |\n`;
            });
            md += `\n`;
        }
        
        return md;
    }
    
    // Si es Evaluación
    if (data.datosEvaluacion && data.preguntas) {
        const { datosEvaluacion, instrucciones, preguntas, solucionario } = data;
        let md = `# EVALUACIÓN DE ${datosEvaluacion.area.toUpperCase()}\n\n`;
        md += `**Nivel:** ${datosEvaluacion.nivel}  \n`;
        md += `**Grado:** ${datosEvaluacion.grado}  \n`;
        md += `**Tema:** ${datosEvaluacion.tema}  \n`;
        md += `**Tipo:** ${datosEvaluacion.tipoEvaluacion}  \n\n`;
        
        md += `### INSTRUCCIONES:\n${instrucciones}\n\n`;
        
        preguntas.forEach(q => {
            md += `**${q.numero}. ${q.pregunta}**\n`;
            if (q.opciones && q.opciones.length > 0) {
                q.opciones.forEach(opt => {
                    md += `- ${opt}\n`;
                });
            }
            md += `\n`;
        });
        
        if (solucionario) {
            md += `### SOLUCIONARIO / CRITERIOS DE CORRECCIÓN:\n${solucionario}\n`;
        }
        return md;
    }
    
    // Si es Autoevaluación
    if (data.datosFicha) {
        const { datosFicha, introduccion, criteriosSer, criteriosDecidir, preguntasMetacognitivas } = data;
        let md = `# FICHA DE AUTOEVALUACIÓN\n\n`;
        md += `**Nivel:** ${datosFicha.nivel} | **Curso:** ${datosFicha.grado} | **Área:** ${datosFicha.area} | **Trimestre:** ${datosFicha.trimestre}\n\n`;
        md += `*${introduccion}*\n\n`;
        
        md += `### DIMENSIÓN DEL SER (Valores y convivencia):\n`;
        (criteriosSer || []).forEach(c => {
            md += `${c.id}. ${c.criterio}\n`;
        });
        md += `\n`;
        
        md += `### DIMENSIÓN DEL DECIDIR (Compromiso y acciones comunitarias):\n`;
        (criteriosDecidir || []).forEach(c => {
            md += `${c.id}. ${c.criterio}\n`;
        });
        md += `\n`;
        
        md += `### PREGUNTAS METACOGNITIVAS DE REFLEXIÓN:\n`;
        (preguntasMetacognitivas || []).forEach((q, idx) => {
            md += `${idx + 1}. ${q}\n`;
        });
        
        return md;
    }
    
    return JSON.stringify(data, null, 2);
}

/**
 * Exporta un Markdown tradicional a un archivo .doc (HTML)
 */
function exportMarkdownToDoc(markdown, filename) {
    const htmlContent = markdownToHtml(markdown);
    
    const documentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
        <title>Documento Docente</title>
        <!--[if gte mso 9]>
        <xml>
            <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>100</w:Zoom>
                <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
            body {
                font-family: 'Calibri', 'Arial', sans-serif;
                font-size: 11pt;
                line-height: 1.25;
                margin: 2.54cm 2.54cm 2.54cm 2.54cm;
            }
            h1 {
                font-size: 18pt;
                color: #1e3a8a;
                font-family: 'Arial', sans-serif;
                margin-top: 18pt;
                margin-bottom: 6pt;
                border-bottom: 2px solid #1e3a8a;
                padding-bottom: 3pt;
            }
            h2 {
                font-size: 14pt;
                color: #0369a1;
                font-family: 'Arial', sans-serif;
                margin-top: 14pt;
                margin-bottom: 4pt;
            }
            h3 {
                font-size: 12pt;
                color: #0f766e;
                font-family: 'Arial', sans-serif;
                margin-top: 10pt;
                margin-bottom: 2pt;
            }
            p {
                margin-top: 0pt;
                margin-bottom: 6pt;
                text-align: justify;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 12pt 0;
            }
            th {
                background-color: #f1f5f9;
                font-weight: bold;
                border: 1px solid #94a3b8;
                padding: 6px;
                text-align: left;
            }
            td {
                border: 1px solid #cbd5e1;
                padding: 6px;
                vertical-align: top;
            }
        </style>
    </head>
    <body>
        ${htmlContent}
    </body>
    </html>
    `;

    const blob = new Blob(['\ufeff' + documentHtml], {
        type: 'application/msword;charset=utf-8'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function makeTextRuns(text, options = {}) {
    if (!text) return [new docx.TextRun({ text: "" })];
    const parts = text.split(/\*\*/g);
    return parts.map((part, idx) => {
        const isBold = idx % 2 === 1;
        return new docx.TextRun({
            text: part,
            bold: isBold || options.bold || false,
            italic: options.italic || false,
            size: (options.size || 11) * 2,
            font: "Arial",
            color: options.color || "000000"
        });
    });
}

function makeParagraphWithFormatting(text, options = {}) {
    return new docx.Paragraph({
        children: makeTextRuns(text, options),
        spacing: { before: options.before || 80, after: options.after || 80 },
        alignment: options.alignment || docx.AlignmentType.LEFT
    });
}

/**
 * Genera un archivo DOCX real estructurado usando la librería docx
 */
export function exportJsonToDocx(data, filename) {
    const { datosReferenciales, objetivoHolisticoNivel, estructuraPDC, adaptacionesSignificativas } = data;
    const isInicial = estructuraPDC.tipo === 'directo';

    const children = [];

    // Título principal
    children.push(new docx.Paragraph({
        children: [
            new docx.TextRun({
                text: "PLAN DE DESARROLLO CURRICULAR (PDC)",
                bold: true,
                size: 32, // 16pt
                font: "Arial",
                color: "1E3A8A"
            })
        ],
        alignment: docx.AlignmentType.CENTER,
        spacing: { before: 200, after: 200 }
    }));

    // Datos Referenciales Table
    const refRows = [];
    const fields = [
        { label: "Distrito Educativo:", value: datosReferenciales.distrito },
        { label: "Unidad Educativa:", value: datosReferenciales.unidadEducativa },
        { label: "Nivel:", value: datosReferenciales.nivel },
        { label: "Año de Escolaridad:", value: datosReferenciales.grado },
        { label: "Maestra/o:", value: datosReferenciales.maestro },
        { label: "Director/a:", value: datosReferenciales.director },
        { label: "Trimestre:", value: datosReferenciales.trimestre },
        { label: "Gestión / Fechas:", value: `${datosReferenciales.gestion} (Del ${datosReferenciales.fechaInicio} al ${datosReferenciales.fechaFin})` }
    ];

    const borderStyle = {
        style: docx.BorderStyle.SINGLE,
        size: 4,
        color: "CBD5E1"
    };

    const tableBorders = {
        top: borderStyle,
        bottom: borderStyle,
        left: borderStyle,
        right: borderStyle,
        insideHorizontal: borderStyle,
        insideVertical: borderStyle
    };

    for (let i = 0; i < fields.length; i += 2) {
        const field1 = fields[i];
        const field2 = fields[i + 1] || { label: "", value: "" };

        refRows.push(new docx.TableRow({
            children: [
                new docx.TableCell({
                    children: [makeParagraphWithFormatting(`**${field1.label}** ${field1.value}`, { size: 10 })],
                    width: { size: 50, type: docx.WidthType.PERCENTAGE }
                }),
                new docx.TableCell({
                    children: [makeParagraphWithFormatting(`**${field2.label}** ${field2.value}`, { size: 10 })],
                    width: { size: 50, type: docx.WidthType.PERCENTAGE }
                })
            ]
        }));
    }

    children.push(new docx.Table({
        rows: refRows,
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
        borders: tableBorders,
        margins: { top: 100, bottom: 100, left: 150, right: 150 }
    }));

    // Objetivo Holístico de Nivel
    children.push(makeParagraphWithFormatting("\n**1. OBJETIVO HOLÍSTICO DE NIVEL / DE APRENDIZAJE**", { bold: true, size: 12, color: "1E3A8A" }));
    children.push(makeParagraphWithFormatting(objetivoHolisticoNivel, { italic: true, size: 11, before: 60, after: 120 }));

    // Desarrollo Curricular por Áreas
    children.push(makeParagraphWithFormatting("**2. DESARROLLO CURRICULAR Y PEDAGÓGICO**", { bold: true, size: 12, color: "1E3A8A" }));

    (estructuraPDC.areas || []).forEach(area => {
        children.push(makeParagraphWithFormatting(`**ÁREA DE SABERES Y CONOCIMIENTOS: ${area.nombreArea.toUpperCase()}**`, { bold: true, size: 11, color: "0369A1", before: 120, after: 60 }));
        if (area.objetivoAprendizaje) {
            children.push(makeParagraphWithFormatting(`**Objetivo de Aprendizaje:** ${area.objetivoAprendizaje}`, { size: 10, before: 40, after: 40 }));
        }
        if (area.contenidos && area.contenidos.length > 0) {
            children.push(makeParagraphWithFormatting(`**Contenidos:** ${area.contenidos.join(", ")}`, { size: 10, before: 40, after: 80 }));
        }

        if (isInicial) {
            // Estructura Inicial (Directa, sin semanas)
            const tableRows = [
                // Header Row
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            children: [makeParagraphWithFormatting("**MOMENTOS DEL PROCESO FORMATIVO**", { bold: true, size: 10 })],
                            width: { size: 50, type: docx.WidthType.PERCENTAGE },
                            backgroundColor: "F1F5F9"
                        }),
                        new docx.TableCell({
                            children: [makeParagraphWithFormatting("**RECURSOS/MATERIALES**", { bold: true, size: 10 })],
                            width: { size: 25, type: docx.WidthType.PERCENTAGE },
                            backgroundColor: "F1F5F9"
                        }),
                        new docx.TableCell({
                            children: [makeParagraphWithFormatting("**CRITERIOS DE EVALUACIÓN**", { bold: true, size: 10 })],
                            width: { size: 25, type: docx.WidthType.PERCENTAGE },
                            backgroundColor: "F1F5F9"
                        })
                    ]
                })
            ];

            const moments = area.momentosDirectos || {};
            const resources = area.recursosDirectos || {};
            const criteria = area.criteriosDirectos || {};

            // Momentos Cell children
            const momentsChildren = [
                makeParagraphWithFormatting(`**PRÁCTICA:** ${moments.practica || ''}`, { size: 9 }),
                makeParagraphWithFormatting(`**TEORÍA:** ${moments.teoria || ''}`, { size: 9 }),
                makeParagraphWithFormatting(`**VALORACIÓN:** ${moments.valoracion || ''}`, { size: 9 }),
                makeParagraphWithFormatting(`**PRODUCCIÓN:** ${moments.produccion || ''}`, { size: 9 })
            ];

            // Recursos Cell children
            const resourcesChildren = [
                makeParagraphWithFormatting(`**Analógicos:** ${(resources.analogicos || []).join(", ")}`, { size: 9 }),
                makeParagraphWithFormatting(`**Producción:** ${(resources.produccion || []).join(", ")}`, { size: 9 }),
                makeParagraphWithFormatting(`**Vida Diaria:** ${(resources.vida || []).join(", ")}`, { size: 9 })
            ];

            // Criterios Cell children
            const criteriaChildren = [
                makeParagraphWithFormatting(`**SER:** ${criteria.ser || ''}`, { size: 9 }),
                makeParagraphWithFormatting(`**SABER:** ${criteria.saber || ''}`, { size: 9 }),
                makeParagraphWithFormatting(`**HACER:** ${criteria.hacer || ''}`, { size: 9 }),
                makeParagraphWithFormatting(`**DECIDIR:** ${criteria.decidir || ''}`, { size: 9 })
            ];

            tableRows.push(new docx.TableRow({
                children: [
                    new docx.TableCell({ children: momentsChildren }),
                    new docx.TableCell({ children: resourcesChildren }),
                    new docx.TableCell({ children: criteriaChildren })
                ]
            }));

            // Adaptaciones curriculares row
            if (area.adaptacionesCurriculares) {
                tableRows.push(new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            children: [makeParagraphWithFormatting(`**Adaptaciones Curriculares (Generales):** ${area.adaptacionesCurriculares}`, { size: 9 })],
                            columnSpan: 3
                        })
                    ]
                }));
            }

            children.push(new docx.Table({
                rows: tableRows,
                width: { size: 100, type: docx.WidthType.PERCENTAGE },
                borders: tableBorders
            }));

        } else {
            // Estructura Primaria / Secundaria (Semanas)
            const tableRows = [
                // Header Row
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            children: [makeParagraphWithFormatting("**SEMANA / PERIODOS**", { bold: true, size: 10, alignment: docx.AlignmentType.CENTER })],
                            width: { size: 15, type: docx.WidthType.PERCENTAGE },
                            backgroundColor: "F1F5F9"
                        }),
                        new docx.TableCell({
                            children: [makeParagraphWithFormatting("**MOMENTOS METODOLÓGICOS**", { bold: true, size: 10 })],
                            width: { size: 45, type: docx.WidthType.PERCENTAGE },
                            backgroundColor: "F1F5F9"
                        }),
                        new docx.TableCell({
                            children: [makeParagraphWithFormatting("**RECURSOS**", { bold: true, size: 10 })],
                            width: { size: 20, type: docx.WidthType.PERCENTAGE },
                            backgroundColor: "F1F5F9"
                        }),
                        new docx.TableCell({
                            children: [makeParagraphWithFormatting("**CRITERIOS DE EVALUACIÓN**", { bold: true, size: 10 })],
                            width: { size: 20, type: docx.WidthType.PERCENTAGE },
                            backgroundColor: "F1F5F9"
                        })
                    ]
                })
            ];

            (area.semanas || []).forEach(w => {
                const moments = w.momentos || {};
                const resources = w.recursos || {};
                const criteria = w.criteriosEvaluacion || {};

                tableRows.push(new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            children: [
                                makeParagraphWithFormatting(`**Semana ${w.semana}**`, { bold: true, size: 9, alignment: docx.AlignmentType.CENTER }),
                                makeParagraphWithFormatting(`(${w.periodos || 8} Períodos)`, { size: 8, alignment: docx.AlignmentType.CENTER })
                            ],
                            verticalAlign: docx.VerticalAlign.CENTER
                        }),
                        new docx.TableCell({
                            children: [
                                makeParagraphWithFormatting(`**PRÁCTICA:** ${moments.practica || ''}`, { size: 9 }),
                                makeParagraphWithFormatting(`**TEORÍA:** ${moments.teoria || ''}`, { size: 9 }),
                                makeParagraphWithFormatting(`**VALORACIÓN:** ${moments.valoracion || ''}`, { size: 9 }),
                                makeParagraphWithFormatting(`**PRODUCCIÓN:** ${moments.produccion || ''}`, { size: 9 })
                            ]
                        }),
                        new docx.TableCell({
                            children: [
                                makeParagraphWithFormatting(`**Analógicos:** ${(resources.analogicos || []).join(", ")}`, { size: 9 }),
                                makeParagraphWithFormatting(`**Producción:** ${(resources.produccion || []).join(", ")}`, { size: 9 }),
                                makeParagraphWithFormatting(`**Vida Diaria:** ${(resources.vida || []).join(", ")}`, { size: 9 })
                            ]
                        }),
                        new docx.TableCell({
                            children: [
                                makeParagraphWithFormatting(`**SER:** ${criteria.ser || ''}`, { size: 9 }),
                                makeParagraphWithFormatting(`**SABER:** ${criteria.saber || ''}`, { size: 9 }),
                                makeParagraphWithFormatting(`**HACER:** ${criteria.hacer || ''}`, { size: 9 }),
                                makeParagraphWithFormatting(`**DECIDIR:** ${criteria.decidir || ''}`, { size: 9 })
                            ]
                        })
                    ]
                }));
            });

            // Row for Adaptaciones Curriculares (Generales)
            if (area.adaptacionesCurriculares) {
                tableRows.push(new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            children: [makeParagraphWithFormatting(`**Adaptaciones Curriculares (Generales / Ritmos de Aprendizaje):** ${area.adaptacionesCurriculares}`, { size: 9 })],
                            columnSpan: 4
                        })
                    ]
                }));
            }

            children.push(new docx.Table({
                rows: tableRows,
                width: { size: 100, type: docx.WidthType.PERCENTAGE },
                borders: tableBorders
            }));
        }
    });

    // Adaptaciones Curriculares Significativas
    if (adaptacionesSignificativas && adaptacionesSignificativas.length > 0) {
        children.push(makeParagraphWithFormatting("\n**3. ADAPTACIONES CURRICULARES SIGNIFICATIVAS (DISCAPACIDAD/TEA/TALENTO)**", { bold: true, size: 12, color: "1E3A8A", before: 200 }));
        
        const sigTableRows = [
            new docx.TableRow({
                children: [
                    new docx.TableCell({ children: [makeParagraphWithFormatting("**Estudiante**", { bold: true, size: 10 })], backgroundColor: "F1F5F9", width: { size: 20, type: docx.WidthType.PERCENTAGE } }),
                    new docx.TableCell({ children: [makeParagraphWithFormatting("**Dificultad / Discapacidad**", { bold: true, size: 10 })], backgroundColor: "F1F5F9", width: { size: 20, type: docx.WidthType.PERCENTAGE } }),
                    new docx.TableCell({ children: [makeParagraphWithFormatting("**Contenido**", { bold: true, size: 10 })], backgroundColor: "F1F5F9", width: { size: 20, type: docx.WidthType.PERCENTAGE } }),
                    new docx.TableCell({ children: [makeParagraphWithFormatting("**Adaptación**", { bold: true, size: 10 })], backgroundColor: "F1F5F9", width: { size: 20, type: docx.WidthType.PERCENTAGE } }),
                    new docx.TableCell({ children: [makeParagraphWithFormatting("**Criterio Evaluación**", { bold: true, size: 10 })], backgroundColor: "F1F5F9", width: { size: 20, type: docx.WidthType.PERCENTAGE } })
                ]
            })
        ];

        adaptacionesSignificativas.forEach(st => {
            sigTableRows.push(new docx.TableRow({
                children: [
                    new docx.TableCell({ children: [makeParagraphWithFormatting(st.estudiante, { size: 9 })] }),
                    new docx.TableCell({ children: [makeParagraphWithFormatting(st.discapacidad, { size: 9 })] }),
                    new docx.TableCell({ children: [makeParagraphWithFormatting(st.contenido, { size: 9 })] }),
                    new docx.TableCell({ children: [makeParagraphWithFormatting(st.adaptacion, { size: 9 })] }),
                    new docx.TableCell({ children: [makeParagraphWithFormatting(st.criterioEvaluacion, { size: 9 })] })
                ]
            }));
        });

        children.push(new docx.Table({
            rows: sigTableRows,
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            borders: tableBorders
        }));
    }

    // Firmas
    children.push(new docx.Paragraph({ text: "", spacing: { before: 800 } })); // espaciador
    
    children.push(new docx.Table({
        rows: [
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [
                            makeParagraphWithFormatting("_________________________", { alignment: docx.AlignmentType.CENTER, size: 10 }),
                            makeParagraphWithFormatting("Firma del Maestro(a)", { alignment: docx.AlignmentType.CENTER, size: 10 })
                        ],
                        borders: { top: docx.BorderStyle.NONE, bottom: docx.BorderStyle.NONE, left: docx.BorderStyle.NONE, right: docx.BorderStyle.NONE }
                    }),
                    new docx.TableCell({
                        children: [
                            makeParagraphWithFormatting("_________________________", { alignment: docx.AlignmentType.CENTER, size: 10 }),
                            makeParagraphWithFormatting("Firma del Director(a)", { alignment: docx.AlignmentType.CENTER, size: 10 })
                        ],
                        borders: { top: docx.BorderStyle.NONE, bottom: docx.BorderStyle.NONE, left: docx.BorderStyle.NONE, right: docx.BorderStyle.NONE }
                    })
                ]
            })
        ],
        width: { size: 100, type: docx.WidthType.PERCENTAGE }
    }));

    const doc = new docx.Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: 1440,
                        bottom: 1440,
                        left: 1440,
                        right: 1440
                    }
                }
            },
            children: children
        }]
    });

    docx.Packer.toBlob(doc).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }).catch(err => {
        console.error("Error al generar el documento Word DOCX real:", err);
    });
}

/**
 * Exporta texto en Markdown o JSON estructurado a un archivo compatible con Word (.docx)
 */
export function exportToWord(content, filename = 'planificacion_docente') {
    let pdcData = null;
    try {
        if (typeof content === 'object') {
            pdcData = content;
        } else if (typeof content === 'string') {
            pdcData = JSON.parse(content);
        }
    } catch (e) {
        // No es JSON, usar el exportador de markdown normal
        return exportMarkdownToDoc(content, filename);
    }
    
    if (pdcData && pdcData.datosReferenciales && pdcData.estructuraPDC) {
        // Es un JSON estructurado de PDC, exportar con docx
        return exportJsonToDocx(pdcData, filename);
    } else {
        return exportMarkdownToDoc(jsonToMarkdown(pdcData), filename);
    }
}

/**
 * Copia el contenido Markdown o JSON estructurado al portapapeles como Rich Text (HTML)
 */
export async function copyAsRichText(content) {
    let rawMarkdown = content;
    try {
        const parsed = typeof content === 'object' ? content : JSON.parse(content);
        rawMarkdown = jsonToMarkdown(parsed);
    } catch (err) {}

    const htmlContent = `
        <div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.25;">
            ${markdownToHtml(rawMarkdown)}
        </div>
    `;

    try {
        const textBlob = new Blob([rawMarkdown], { type: 'text/plain' });
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        
        const data = [
            new ClipboardItem({
                'text/plain': textBlob,
                'text/html': htmlBlob
            })
        ];
        
        await navigator.clipboard.write(data);
        return true;
    } catch (err) {
        console.error('Error al copiar texto con formato:', err);
        // Fallback a texto plano si falla
        try {
            await navigator.clipboard.writeText(rawMarkdown);
            return true;
        } catch (e) {
            return false;
        }
    }
}

/**
 * Abre una ventana de impresión del navegador formateando el documento estéticamente
 */
export function printDocument(title, content) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let rawMarkdown = content;
    try {
        const parsed = typeof content === 'object' ? content : JSON.parse(content);
        rawMarkdown = jsonToMarkdown(parsed);
    } catch (err) {}

    const htmlContent = markdownToHtml(rawMarkdown);

    printWindow.document.write(`
        <html>
        <head>
            <title>${title}</title>
            <style>
                body {
                    font-family: 'Calibri', 'Arial', sans-serif;
                    color: #000;
                    margin: 2cm;
                    font-size: 11pt;
                    line-height: 1.4;
                }
                h1 {
                    font-size: 20pt;
                    color: #1e3a8a;
                    border-bottom: 2px solid #1e3a8a;
                    padding-bottom: 5px;
                    margin-top: 20px;
                }
                h2 {
                    font-size: 15pt;
                    color: #0369a1;
                    margin-top: 15px;
                }
                h3 {
                    font-size: 12pt;
                    color: #0f766e;
                }
                table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 15px 0;
                }
                th {
                    background-color: #f1f5f9 !important;
                    font-weight: bold;
                    border: 1px solid #94a3b8;
                    padding: 8px;
                    text-align: left;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                td {
                    border: 1px solid #cbd5e1;
                    padding: 8px;
                    vertical-align: top;
                }
                p {
                    margin-bottom: 10px;
                    text-align: justify;
                }
                @media print {
                    body {
                        margin: 0;
                    }
                    button {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div style="text-align: center; margin-bottom: 20px; display: flex; justify-content: flex-end;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 10pt;">
                    Imprimir / Guardar como PDF
                </button>
            </div>
            <div>
                ${htmlContent}
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}
