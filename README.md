# Coil Winding Calculator

Calculadora de diseño de embobinado para inductores chip. Desarrollada en HTML/CSS/JS vanilla, sin dependencias ni frameworks. Corre directamente en cualquier navegador.

## Estructura del proyecto

```
coil-winding-calculator/
├── index.html          ← Página principal
├── css/
│   └── styles.css      ← Todos los estilos
├── js/
│   └── main.js         ← Toda la lógica de cálculo
└── .vscode/
    ├── settings.json   ← Configuración del editor
    └── extensions.json ← Extensiones recomendadas
```

## Cómo usar en VS Code

1. Abrir la carpeta del proyecto en VS Code
2. Instalar la extensión **Live Server** (aparece en recomendaciones)
3. Click derecho en `index.html` → **Open with Live Server**
4. Se abre automáticamente en el navegador en `http://localhost:5500`

## Parámetros de entrada

| Campo | Descripción |
|-------|-------------|
| **L (µH)** | Inductancia objetivo del inductor |
| **I máx (A)** | Corriente máxima DC de operación |
| **DCR máx (Ω)** | Resistencia DC máxima permitida |
| **AL (nH/N²)** | Factor de inductancia del núcleo — medir con LCR meter |
| **Tipo de vueltas** | Entero / 0.5 / exacto |
| **Largo bobina** | Largo total del cilindro (mils / inch / mm) |
| **Corte** | Zona sin bobinar — rebaje del proceso |
| **OD** | Diámetro externo del cilindro |
| **ID** | Diámetro interno — 0 si es sólido |
| **Tipo esmalte** | SE (105°C) / HE (130°C) / HAPTZ (180°C) |
| **AWG** | Calibre del alambre (10–44) |
| **J (A/cm²)** | Densidad de corriente — 200/400/600 según aplicación |

## Resultados calculados

- **N** — Vueltas redondeadas según modo seleccionado
- **N exacto** — Valor sin redondear para referencia
- **DCR** — Resistencia DC estimada del embobinado
- **Longitud de alambre** — Centímetros totales necesarios
- **Largo efectivo** — Largo − Corte en mils
- **MLT** — Mean Length per Turn (longitud media por vuelta)
- **Vueltas/capa** — Cuántas vueltas caben en el largo efectivo
- **Capas** — Número de capas necesarias

## Tipos de alambre esmaltado

| Tipo | Clase | Temp. max | Capas | Factor Ø |
|------|-------|-----------|-------|----------|
| SE   | A     | 105°C     | 1     | ×1.03    |
| HE   | B     | 130°C     | 2     | ×1.06    |
| HAPTZ| H     | 180°C     | 2 gruesas | ×1.08 |

## Referencia B-8000-6

| Parámetro | Valor |
|-----------|-------|
| L | 0.100 µH |
| I máx | 470 mA |
| DCR máx | 110 mΩ |
| Alambre | AWG 36 HE |
| Vueltas | 6.5 (Close Layer) |
| Largo | 86–88 mils |
| Corte | 32–33 mils |
| AL calculado | 2.37 nH/N² |

## Fórmulas principales

```
N = √(L / AL)                          vueltas
DCR = ρ × (N × MLT) / A_conductor     resistencia DC
Vueltas/capa = floor(largo_ef / Ø_alambre_esmaltado)
Capas = ceil(N / vueltas_por_capa)
```

## Notas

- Siempre verificar con **LCR meter** después de fabricar el prototipo
- El AL del núcleo puede variar según presión de compactado y material
- Para inductores encapsulados usar J = 200 A/cm²
