/**
 * default-data.js — Datos iniciales de facultades y programas
 * ---
 * Responsabilidad:
 *   - única fuente de verdad de window.__DEFAULT_DATA
 *   - exponer en window.__DEFAULT_DATA para inicialización de DB
 *   - cargar antes que app.js (orden en HTML)
 *
 * Dependencias:
 *   - ninguna (se carga antes que app.js)
 *
 * Uso:
 *   window.__DEFAULT_DATA (desde cualquier módulo)
 */
window.__DEFAULT_DATA = [
  {
    "id": "admin",
    "name": "Facultad de Ciencias Admin., Económicas y Contables",
    "doc": {
      "n": "Doctorado en Administración y Dirección de Empresas",
      "e": "Por construir",
      "o": "P",
      "sedes": [],
      "resp": "Instituto de posgrados",
      "mes": 11,
      "ano": 2026,
      "enlaceObtencion": ""
    },
    "progs": [
      {
        "id": "id1774918209474t80",
        "n": "Administración de Empresas",
        "sedes": [
          "Fusagasugá",
          "Ubate",
          "Chía",
          "Facatativá",
          "Girardot",
          "Soacha"
        ],
        "lineas": [
          {
            "id": "id1774918209474pfl",
            "l": "Marketing digital",
            "t": "Profundización 2",
            "esp": "Especialización en Marketing Digital",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id1774918209474rky",
            "l": "Gestión y administración",
            "t": "Profundización 1",
            "esp": "Especialización en Gestión Pública",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Ubate"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/normatividad/resoluciones-men/2024/Resolucion_001281.pdf"
          },
          {
            "id": "id1774918209474720",
            "l": "Innovación Tecnológica En Las Organizaciones",
            "t": "Profundización 2",
            "esp": "Esp. Gerencia para la Transformación Digital de Las Organizaciones",
            "e": "Renovación y modificación de la denominación",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Chía",
              "Facatativá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/normatividad/resoluciones-men/2024/Transformacion_001411.pdf"
          },
          {
            "id": "id17749182094742q2",
            "l": "Analítica de inteligencia de negocios",
            "t": "Profundización 2",
            "esp": "Especialización en Analítica Aplicada a Negocios",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Girardot",
              "Soacha"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id17749182094741h1",
            "l": "Gerencia financiera y diagnóstico estratégico",
            "t": "Profundización 1",
            "esp": "Esp. en Gerencia Financiera y Diagnóstico Estratégico",
            "e": "Radicado MEN",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id1774918209474g6g",
            "l": "Logística integral",
            "t": "Profundización 1",
            "esp": "Especialización en Logística y Comercio Internacional",
            "e": "Negado MEN",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Facatativá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id1774918209474792",
            "l": "Emprendimiento turístico",
            "t": "Profundización 1",
            "esp": "Esp. en Gestión del Emprendimiento en Org. Turísticas",
            "e": "En construcción",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Chía",
              "Girardot",
              "Soacha"
            ],
            "resp": "Instituto de posgrados",
            "mes": 9,
            "ano": 2026,
            "enlaceObtencion": null
          },
          {
            "id": "id17878386218375lg",
            "l": "Gerencia financiera y diagnóstico estratégico",
            "t": "Profundización 2",
            "esp": "Esp. en Gerencia Financiera y Diagnóstico Estratégico",
            "e": "Radicado MEN",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Ubate"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          }
        ],
        "mae": [
          {
            "id": "id1774918209474vrw",
            "n": "Maestría en Marketing Digital",
            "e": "Radicado MEN",
            "o": "P",
            "sedes": [
              "Chía",
              "Facatativá",
              "Fusagasugá",
              "Soacha",
              "Ubate"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null,
            "tipo": "Profundización"
          },
          {
            "id": "id1774918209474g9v",
            "n": "Maestría en Administración de Empresas - MBA",
            "e": "En construcción",
            "o": "P",
            "sedes": [
              "Chía",
              "Facatativá",
              "Fusagasugá",
              "Soacha",
              "Ubate"
            ],
            "resp": "Instituto de posgrados",
            "mes": 9,
            "ano": 2026,
            "enlaceObtencion": null,
            "tipo": "Profundización"
          },
          {
            "id": "id1774918209474twh",
            "n": "Maestría en Gerencia Financiera, Tributaria y Sostenibilidad Empresarial",
            "e": "Por construir",
            "o": "P",
            "sedes": [
              "Chía",
              "Facatativá",
              "Fusagasugá",
              "Soacha",
              "Ubate"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null,
            "tipo": "Profundización"
          }
        ]
      },
      {
        "id": "id1774918209474tn9",
        "n": "Contaduría Pública",
        "sedes": [
          "Fusagasugá",
          "Soacha",
          "Facatativá",
          "Chía",
          "Ubate"
        ],
        "lineas": [
          {
            "id": "id1774918209474rf4",
            "l": "Financiera y contable",
            "t": "Profundización 2",
            "esp": "Especialización en Gerencia Financiera y Contable",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Chía",
              "Facatativá",
              "Fusagasugá",
              "Soacha",
              "Ubate"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/normatividad/resoluciones-men/2025/Resolucion_001813.pdf"
          },
          {
            "id": "id1774918209474077",
            "l": "Gestión tributaria",
            "t": "Profundización 1",
            "esp": "Especialización en Gestión Tributaria",
            "e": "Negado MEN",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Chía",
              "Facatativá",
              "Fusagasugá",
              "Soacha",
              "Ubate"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          }
        ],
        "mae": [
          {
            "id": "id1774918209474bl9",
            "n": "Maestría en Gerencia Financiera, Tributaria y Sostenibilidad Empresarial",
            "e": "Por construir",
            "o": "P",
            "sedes": [
              "Chía",
              "Facatativá",
              "Fusagasugá",
              "Soacha",
              "Ubate"
            ],
            "resp": "Instituto de posgrados",
            "mes": 10,
            "ano": 2026,
            "enlaceObtencion": null,
            "tipo": "Profundización"
          }
        ]
      }
    ]
  },
  {
    "id": "ing",
    "name": "Facultad de Ingeniería",
    "doc": {
      "n": "Doctorado en Ingeniería",
      "e": "En construcción",
      "o": "P",
      "sedes": [],
      "resp": "Instituto de posgrados",
      "mes": 11,
      "ano": 2026,
      "enlaceObtencion": ""
    },
    "progs": [
      {
        "id": "id1774918209474rf6",
        "n": "Ingeniería de Software",
        "sedes": [
          "Soacha",
          "Girardot"
        ],
        "lineas": [
          {
            "id": "id1774918209474zw7",
            "l": "Desarrollo del software con estándares de calidad",
            "t": "Profundización 2",
            "esp": "Esp. en Metodologías de Calidad para el Desarrollo del Software",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Girardot",
              "Soacha"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/varios/2024/R_024796.pdf"
          },
          {
            "id": "id1774918209474zo6",
            "l": "Ciencia de datos",
            "t": "Profundización 1",
            "esp": "Especialización en Analítica y Ciencia de Datos",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Girardot",
              "Soacha"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/varios/2024/RC-023876.pdf"
          }
        ],
        "mae": [
          {
            "id": "id1774918209474sv4",
            "n": "Maestría en TIC para Territorios Inteligentes",
            "e": "En construcción",
            "o": "P",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "Instituto de posgrados",
            "mes": 9,
            "ano": 2026,
            "enlaceObtencion": null,
            "tipo": "Profundización"
          }
        ]
      },
      {
        "id": "id1774918209474l2g",
        "n": "Ingeniería de Sistemas y Computación",
        "sedes": [
          "Chía",
          "Ubate",
          "Facatativá",
          "Fusagasugá"
        ],
        "lineas": [
          {
            "id": "id177491820947468q",
            "l": "Software seguro y de calidad",
            "t": "Profundización 1",
            "esp": "Esp. en Metodologías de Calidad para el Desarrollo del Software",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/varios/2024/R_024796.pdf"
          },
          {
            "id": "id1774918209474vrm",
            "l": "Inteligencia artificial",
            "t": "Profundización 2",
            "esp": "Especialización en Inteligencia Artificial",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Facatativá",
              "Ubate"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/varios/2024/R_023579.pdf"
          },
          {
            "id": "id1774918209474eru",
            "l": "Ciencia de datos",
            "t": "Profundización 1",
            "esp": "Especialización en Analítica y Ciencia de Datos",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Chía"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/varios/2024/RC-023876.pdf"
          },
          {
            "id": "id1774918209474afo",
            "l": "Redes y seguridad",
            "t": "Profundización 2",
            "esp": "Especialización en Infraestructura y Seguridad de Redes",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/varios/2024/RC-023762.pdf"
          },
          {
            "id": "id1774918209474pi7",
            "l": "Desarrollo de software",
            "t": "Profundización 1",
            "esp": "Especialización en Seguridad de la Información",
            "e": "Negado MEN",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Ubate"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id1787757831548cpu",
            "l": "Big Data",
            "t": "Profundización 1",
            "esp": "Especialización en Analítica y Ciencia de Datos",
            "e": "Obtención",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Facatativá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/varios/2024/RC-023876.pdf"
          },
          {
            "id": "id1787780005421sm3",
            "l": "Software seguro y de calidad",
            "t": "Profundización 2",
            "esp": "Especialización en Seguridad de La Información",
            "e": "Radicado MEN",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Chía"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          }
        ],
        "mae": [
          {
            "id": "id17749182094746wy",
            "n": "Maestría en Ingeniería de Sistemas y Computación",
            "e": "En construcción",
            "o": "P",
            "sedes": [
              "Chía",
              "Facatativá",
              "Fusagasugá",
              "Ubate"
            ],
            "resp": "DAYA",
            "mes": 8,
            "ano": 2026,
            "enlaceObtencion": null,
            "tipo": "Profundización"
          }
        ]
      },
      {
        "id": "id1774918209474kb4",
        "n": "Ingeniería Electrónica",
        "sedes": [
          "Fusagasugá"
        ],
        "lineas": [
          {
            "id": "id177491820947445x",
            "l": "Telemática y telecomunicaciones",
            "t": "Profundización 2",
            "esp": "Especialización en Infraestructura y Seguridad de Redes",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/varios/2024/RC-023762.pdf"
          },
          {
            "id": "id1774918209474po7",
            "l": "Diseño Instrumentación y Control",
            "t": "Profundización 1",
            "esp": "Esp. en Control de Convertidores de Potencia para Movilidad Electrica",
            "e": "En construcción",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "Instituto de posgrados",
            "mes": 9,
            "ano": 2026,
            "enlaceObtencion": null
          }
        ],
        "mae": [
          {
            "id": "id17749182094747vt",
            "n": "Maestría en Automatización Industrial",
            "e": "En construcción",
            "o": "P",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "Instituto de posgrados",
            "mes": 9,
            "ano": 2026,
            "enlaceObtencion": null,
            "tipo": "Profundización"
          }
        ]
      },
      {
        "id": "id17749182094745d9",
        "n": "Ingeniería Industrial",
        "sedes": [
          "Soacha",
          "Chía"
        ],
        "lineas": [
          {
            "id": "id1774918209474mir",
            "l": "Ciencia de datos",
            "t": "Profundización 2",
            "esp": "Especialización en Analítica Aplicada a Negocios",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Chía",
              "Soacha"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id1774918209474um9",
            "l": "Logística y cadena de abastecimiento",
            "t": "Profundización 1",
            "esp": "Especialización en Logística y Operaciones",
            "e": "Negado MEN",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Chía",
              "Soacha"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          }
        ],
        "mae": []
      },
      {
        "id": "id177491820947426j",
        "n": "Ingeniería Mecatrónica",
        "sedes": [
          "Chía"
        ],
        "lineas": [
          {
            "id": "id1774918209474jz6",
            "l": "Automatización y telemática aplicada",
            "t": "Profundización 2",
            "esp": "Especialización en Automatización Industrial",
            "e": "Negado MEN",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Chía"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id1787780393912g7m",
            "l": "Energías Renovables y Sostenibilidad Energética",
            "t": "Profundización 1",
            "esp": "Especializacion en Soluciones Energeticas Sostenibles",
            "e": "En construcción",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Chía"
            ],
            "resp": "",
            "mes": 9,
            "ano": null,
            "enlaceObtencion": null
          }
        ],
        "mae": []
      }
    ]
  },
  {
    "id": "agro",
    "name": "Facultad de Ciencias Agropecuarias",
    "doc": {
      "n": "Doctorado en Agricultura Inteligente y Sostenible",
      "e": "En construcción",
      "o": "P",
      "sedes": [],
      "resp": "Instituto de posgrados",
      "mes": 11,
      "ano": 2026,
      "enlaceObtencion": ""
    },
    "progs": [
      {
        "id": "id1774918209474rvk",
        "n": "Zootecnia",
        "sedes": [
          "Fusagasugá",
          "Ubate"
        ],
        "lineas": [
          {
            "id": "id17749182094747we",
            "l": "Recursos zoogenéticos",
            "t": "Profundización 2",
            "esp": "Especialización en Recursos Zoogenéticos",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/varios/2024/R_024262.pdf"
          },
          {
            "id": "id1774918209474cat",
            "l": "Alimentación no convencional",
            "t": "Profundización 1",
            "esp": "Esp. Nutrición y Alimentación Animal Esp. No Convencionales",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/normatividad/resoluciones-men/2024/Resolucion-000129.pdf"
          },
          {
            "id": "id1774918209474krm",
            "l": "Ciencia, tecnología e innovación y Transformación Láctea",
            "t": "Profundización 1",
            "esp": "Esp. Transformación e Innovación de Productos Lácteos y Cárnicos",
            "e": "Por construir",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Ubate"
            ],
            "resp": "DAYA",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id177491820947460y",
            "l": "Reproducción y mejoramiento genético de Especies de Interés Zootécnico",
            "t": "Profundización 2",
            "esp": "Esp. Herramientas Biotécnicas para la Producción Animal",
            "e": "En construcción",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Ubate"
            ],
            "resp": "DAYA",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id17877546018983rj",
            "l": "Alimentación no Convencional (Articulada con fusagasuga)",
            "t": "Profundización 3",
            "esp": "Esp. Nutrición y Alimentación Animal Esp. No Convencionales",
            "e": "Obtención",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Ubate"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/normatividad/resoluciones-men/2024/Resolucion-000129.pdf"
          }
        ],
        "mae": [
          {
            "id": "id1774918209474jlj",
            "n": "Maestría en Gestión Estratégica en Nutrición y Alimentación Animal",
            "e": "Obtención",
            "o": "V",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/normatividad/resoluciones-men/2024/Resolucion_017293.pdf",
            "tipo": ""
          },
          {
            "id": "id1774918209474064",
            "n": "Maestría en Producción Pecuaria e Innovación Agroindustrial",
            "e": "Por construir",
            "o": "P",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null,
            "tipo": "Profundización"
          }
        ]
      },
      {
        "id": "id1774918209474io6",
        "n": "Ingeniería Agronómica",
        "sedes": [
          "Fusagasugá",
          "Facatativá"
        ],
        "lineas": [
          {
            "id": "id1774918209474vuu",
            "l": "Emprendimiento, desarrollo rural y territorio",
            "t": "Profundización 2",
            "esp": "Especialización en Agronegocios Sostenibles",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Facatativá",
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id17749182094742u1",
            "l": "Sistemas de producción agrícola sostenible",
            "t": "Profundización 1",
            "esp": "Esp. en Agroecología y Desarrollo Agroecoturístico",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Facatativá",
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/normatividad/resoluciones-men/2024/Resolucion-023930.pdf"
          }
        ],
        "mae": [
          {
            "id": "id1774918209474u3z",
            "n": "Maestría en Ciencias Agrarias con énfasis en Hortifruticultura",
            "e": "Obtención",
            "o": "V",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/normatividad/resoluciones-men/2024/Resolucion_019618.pdf",
            "tipo": "Profundización"
          },
          {
            "id": "id1774918209474jpq",
            "n": "Maestría en Agricultura Familiar y Sistemas Agroalimentarios Sostenibles",
            "e": "En construcción",
            "o": "P",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "Instituto de posgrados",
            "mes": 9,
            "ano": null,
            "enlaceObtencion": null,
            "tipo": "Investigación"
          }
        ]
      },
      {
        "id": "id1774918209474ea0",
        "n": "Ingeniería Ambiental",
        "sedes": [
          "Girardot",
          "Facatativá"
        ],
        "lineas": [
          {
            "id": "id1774918209474gsp",
            "l": "Recurso hídrico",
            "t": "Profundización 2",
            "esp": "Especialización en Gestión del Recurso Hídrico",
            "e": "Radicado MEN",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Facatativá",
              "Girardot"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id17749182094740xz",
            "l": "Gestión ambiental territorial",
            "t": "Profundización 1",
            "esp": "Esp. en Gestión del Riesgo de Desastres y Planificación Ambiental del Territorio",
            "e": "Radicado MEN",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Girardot"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id1774918209474fvw",
            "l": "Calidad del recurso aire",
            "t": "Profundización 1",
            "esp": "Especialización en Gestión de la Calidad del Recurso Aire",
            "e": "Radicado MEN",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Facatativá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          }
        ],
        "mae": [
          {
            "id": "id17749182094747ul",
            "n": "Maestría en Gestión Ambiental para el Desarrollo Sostenible",
            "e": "Obtención",
            "o": "V",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/normatividad/resoluciones-men/2025/Resolucion_17790.pdf"
          }
        ]
      },
      {
        "id": "id17749182094746xl",
        "n": "Medicina Veterinaria y Zootecnia",
        "sedes": [
          "Ubate"
        ],
        "lineas": [
          {
            "id": "id1774918209474rnm",
            "l": "Especies Animales en Fauna silvestre susceptible de producción",
            "t": "Profundización 1",
            "esp": "Especialización en Sanidad de Animales Silvestres",
            "e": "Por construir",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Ubate"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id1774918209474i1s",
            "l": "Especies Animales Susceptibles de intervención reproductiva",
            "t": "Profundización 2",
            "esp": "Esp. en Técnicas de Reproducción Animal Asistida",
            "e": "Por construir",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Ubate"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          }
        ],
        "mae": [
          {
            "id": "id1774918209474vbs",
            "n": "Maestría en Ciencias Veterinarias de Especies No Convencionales",
            "e": "Por construir",
            "o": "P",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          }
        ]
      },
      {
        "id": "id1774918209474vyv",
        "n": "Ingeniería Topográfica y Geomática",
        "sedes": [
          "Soacha"
        ],
        "lineas": [
          {
            "id": "id17749182094743a5",
            "l": "Cartografía y representación del Espacio Geográfico",
            "t": "Profundización 1",
            "esp": "Especialización en Ciencia de Geo-Datos",
            "e": "Por construir",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Soacha"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id1774918209474ai2",
            "l": "Experiencias de Redes planimétricas y altimétricas",
            "t": "Profundización 2",
            "esp": "Esp. en Topografía Avanzada con fines Catastrales",
            "e": "Por construir",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Soacha"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          }
        ],
        "mae": [
          {
            "id": "id17749182094748xq",
            "n": "Maestría en Geo-datos Aplicados al Ordenamiento Territorial",
            "e": "Por construir",
            "o": "P",
            "sedes": [
              "Soacha"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null,
            "tipo": "Profundización"
          }
        ]
      }
    ]
  },
  {
    "id": "salud",
    "name": "Facultad de Ciencias de la Salud",
    "doc": {
      "n": "Doctorado en Salud Mental y Cuidado Integral",
      "e": "Por construir",
      "o": "P",
      "sedes": [],
      "resp": "Instituto de posgrados",
      "mes": 11,
      "ano": 2026,
      "enlaceObtencion": ""
    },
    "progs": [
      {
        "id": "id1774918209474mlr",
        "n": "Enfermería",
        "sedes": [
          "Girardot"
        ],
        "lineas": [
          {
            "id": "id1774918209474rlh",
            "l": "Cuidado integral en Salud Mental en el ámbito comunitario",
            "t": "Profundización 1",
            "esp": "Especialización en Salud Mental Comunitaria",
            "e": "Negado MEN",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Girardot"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id1774918209474ja8",
            "l": "Gestión del Cuidado de Enfermería, calidad e innovación",
            "t": "Profundización 2",
            "esp": "Esp. en Gestión de la calidad e innovación en salud",
            "e": "En construcción",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Girardot"
            ],
            "resp": "Instituto de posgrados ",
            "mes": 9,
            "ano": 2026,
            "enlaceObtencion": null
          }
        ],
        "mae": [
          {
            "id": "id1774918209474tx0",
            "n": "Maestría en Salud Pública",
            "e": "Negado MEN",
            "o": "P",
            "sedes": [
              "Girardot"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null,
            "tipo": "Profundización"
          },
          {
            "id": "id1774918209474rs0",
            "n": "Maestría en Gerencia de la Calidad en Servicios de Salud",
            "e": "En construcción",
            "o": "P",
            "sedes": [
              "Girardot"
            ],
            "resp": "Instituto de posgrados",
            "mes": 10,
            "ano": 2026,
            "enlaceObtencion": null,
            "tipo": "Investigación"
          }
        ]
      },
      {
        "id": "id1774918209474ktb",
        "n": "Psicología",
        "sedes": [
          "Facatativá"
        ],
        "lineas": [
          {
            "id": "id17749182094749y0",
            "l": "Intervención psicosocial",
            "t": "Profundización 1",
            "esp": "Especialización en Intervención Psicosocial",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Facatativá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id1774918209474m1a",
            "l": "Medición y evaluación psicológica",
            "t": "Profundización 2",
            "esp": "Especialización en Psicometría y Medición Psicológica",
            "e": "En construcción",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Facatativá"
            ],
            "resp": "DAYA",
            "mes": 10,
            "ano": 2026,
            "enlaceObtencion": null
          }
        ],
        "mae": [
          {
            "id": "id1774918209474ab6",
            "n": "Maestría en Gestión Psicosocial en Contextos de Cuidado",
            "e": "En construcción",
            "o": "P",
            "sedes": [
              "Facatativá"
            ],
            "resp": "Instituto de posgrados",
            "mes": 9,
            "ano": 2026,
            "enlaceObtencion": null,
            "tipo": "Profundización"
          },
          {
            "id": "id1774918209474kd9",
            "n": "Maestría en Diseño y Análisis de Instrumentos Psicométricos",
            "e": "En construcción",
            "o": "P",
            "sedes": [
              "Facatativá"
            ],
            "resp": "Instituto de posgrados",
            "mes": 10,
            "ano": 2026,
            "enlaceObtencion": null,
            "tipo": "Profundización"
          }
        ]
      }
    ]
  },
  {
    "id": "dep",
    "name": "Facultad de Ciencias del Deporte y Ed. Física",
    "doc": {
      "n": "Doctorado de Ciencias del Movimiento y el Bienestar",
      "e": "En Construcción",
      "o": "P",
      "sedes": [],
      "resp": "Instituto de posgrados",
      "mes": 11,
      "ano": 2026,
      "enlaceObtencion": ""
    },
    "progs": [
      {
        "id": "id17749182094743d5",
        "n": "Lic. en Educación Física, Recreación y Deportes",
        "sedes": [
          "Fusagasugá"
        ],
        "lineas": [
          {
            "id": "id177491820947414p",
            "l": "Deporte escolar",
            "t": "Profundización 1",
            "esp": "Especialización en Deporte Escolar",
            "e": "Obtención",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/normatividad/resoluciones-men/2024/Resolucion_015763.pdf"
          },
          {
            "id": "id1774918209474wr6",
            "l": "Educación física y discapacidad",
            "t": "Profundización 2",
            "esp": "Especialización en Actividad Física y Discapacidad",
            "e": "Radicado MEN",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          }
        ],
        "mae": [
          {
            "id": "id1774918209474fm2",
            "n": "Maestría en Ciencias del Deporte y la Educación Física",
            "e": "En construcción",
            "o": "P",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "Instituto de posgrados",
            "mes": 9,
            "ano": 2026,
            "enlaceObtencion": null,
            "tipo": "Investigación"
          }
        ]
      },
      {
        "id": "id17749182094747l6",
        "n": "Profesional en Ciencias del Deporte",
        "sedes": [
          "Soacha"
        ],
        "lineas": [
          {
            "id": "id17749182094746eg",
            "l": "Administración deportiva",
            "t": "Profundización 2",
            "esp": "Esp. en Gestión y Desarrollo de la Actividad Física y el Deporte",
            "e": "Radicado MEN",
            "o": "V",
            "motivo": "",
            "sedes": [
              "Soacha"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          },
          {
            "id": "id1774918209474mqf",
            "l": "Entrenamiento deportivo",
            "t": "Profundización 1",
            "esp": "Especialización en Innovación del Entrenamiento Deportivo",
            "e": "Por construir",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Soacha"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": null
          }
        ],
        "mae": []
      }
    ]
  },
  {
    "id": "edu",
    "name": "Facultad de Educación",
    "doc": {
      "n": "Doctorado en Ciencias de la Educación",
      "e": "Obtención-resignificación",
      "o": "P",
      "sedes": [
        "Fusagasugá"
      ],
      "resp": "Instituto de posgrados",
      "mes": 11,
      "ano": 2026,
      "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/normatividad/resoluciones-men/RC-Doctorado.pdf"
    },
    "progs": [
      {
        "id": "id1774918209474rmb",
        "n": "Lic. en Ciencias Sociales",
        "sedes": [
          "Fusagasugá"
        ],
        "lineas": [
          {
            "id": "id17755015357177xb",
            "l": "Educación, Ruralidades y Derechos Humanos.",
            "t": "Profundización 1",
            "esp": "Especialización en Educación, Ruralidades y Derechos Humanos",
            "e": "Por construir",
            "o": "P",
            "motivo": "",
            "sedes": [],
            "resp": "Instituto de posgrados",
            "mes": 10,
            "ano": 2026,
            "enlaceObtencion": null
          },
          {
            "id": "id1775501577009amm",
            "l": "Región y Territorio.",
            "t": "Profundización 2",
            "esp": "Especialización  en ciencias sociales, región y territorio",
            "e": "Por construir",
            "o": "P",
            "motivo": "",
            "sedes": [],
            "resp": "Instituto de posgrados",
            "mes": 10,
            "ano": 2026,
            "enlaceObtencion": null
          },
          {
            "id": "id1786745454271nbi",
            "l": "Semestre avanzado",
            "t": "Sin línea de profundización",
            "esp": "Especialización Educación ambiental y Desarrollo de la Comunidad",
            "e": "Obtención",
            "o": "V",
            "motivo": "Semestre avanzado",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "",
            "mes": null,
            "ano": null,
            "enlaceObtencion": "https://www.ucundinamarca.edu.co/documents/normatividad/resoluciones-men/2022/RRC_Esp_Educacion_Ambiental_Dllo_Comunidad_2022.pdf"
          }
        ],
        "mae": [
          {
            "id": "id1774918209474n41",
            "n": "Maestría en Educación y Gestión del Conocimiento",
            "e": "En construcción",
            "o": "P",
            "sedes": [
              "Fusagasugá"
            ],
            "resp": "Instituto de posgrados",
            "mes": 9,
            "ano": 2026,
            "enlaceObtencion": null,
            "tipo": "Investigación"
          }
        ]
      }
    ]
  },
  {
    "id": "hum",
    "name": "Facultad de Ciencias Sociales, Humanidades y Políticas",
    "doc": null,
    "progs": [
      {
        "id": "id17749182094745sv",
        "n": "Música",
        "sedes": [
          "Zipaquirá"
        ],
        "lineas": [
          {
            "id": "id17749182094749zh",
            "l": "Composición y arreglos",
            "t": "Profundización 1",
            "esp": "Esp. para Línea de Profundización en Dirección Musical",
            "e": "Por construir",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Zipaquirá"
            ],
            "resp": "Instituto de posgrados",
            "mes": 10,
            "ano": 2026,
            "enlaceObtencion": null
          },
          {
            "id": "id17749182094748c1",
            "l": "Producción y gestión musical",
            "t": "Profundización 2",
            "esp": "Esp. para Línea de Profundización en Producción Musical",
            "e": "Por construir",
            "o": "P",
            "motivo": "",
            "sedes": [
              "Zipaquirá"
            ],
            "resp": "Instituto de posgrados",
            "mes": 10,
            "ano": 2026,
            "enlaceObtencion": null
          }
        ],
        "mae": []
      }
    ]
  }
];