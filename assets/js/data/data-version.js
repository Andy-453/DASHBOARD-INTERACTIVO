/**
 * data-version.js — Manifiesto de versión de los datos base
 * ---
 * Responsabilidad:
 *   - declarar la versión de cada dataset base publicado en el repositorio
 *   - registrar la fecha de publicación y el origen del snapshot
 *
 * Concepto:
 *   GitHub contiene la BASE OFICIAL (estos archivos data/*.js).
 *   Cada navegador mantiene su propia COPIA DE TRABAJO en localStorage
 *   (capas udec_rutas_db, udec_learning_routes, udec_snies_data,
 *   udec_sedes_catalog). Este manifiesto describe la base, no el estado
 *   local de un navegador en particular.
 *
 * Este archivo es SOLO LECTURA y no tiene efectos secundarios:
 *   - no escribe en localStorage
 *   - no modifica lógica de la aplicación
 *   - expone window.__DATA_VERSION para herramienta/UI futura
 *
 * Dependencias:
 *   - ninguna (se carga después de los módulos de datos que describe)
 *
 * Uso:
 *   window.__DATA_VERSION (desde cualquier módulo o herramienta)
 */
(function(){
  window.__DATA_VERSION = {
    schemaVersion: 1,
    published: "2026-08-28T20:22:55.048Z",
    snapshot: {
      file: "Dashboard_UDEC_Backup_2026-08-28_1522.json",
      date: "2026-08-28T20:22:55.048Z",
      backupVersion: 2
    },
    datasets: {
      db: {
        version: "1.0.0",
        counts: {
          facultades: 7,
          doctorados: 6,
          programas: 18,
          especializaciones: 52,
          maestrias: 20,
          uniqueIds: 96
        }
      },
      learningRoutes: {
        version: "1.0.0",
        counts: {
          routes: 25,
          orphanRoutes: 0
        }
      },
      snies: {
        version: "1.0.0",
        counts: {
          programs: 12,
          resumenYears: 5
        },
        source: "default"
      },
      rc: {
        version: "1.0.0",
        counts: {
          baseRecords: 19
        },
        snapshotRaw: "none"
      },
      sedes: {
        version: "1.0.0",
        counts: {
          sedes: 7
        }
      }
    }
  };
})();
