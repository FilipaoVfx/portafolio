# scripts

## build-electoral-dataset.mjs

Regenera `src/data/electoral.json` —el agregado anónimo que consume
`/casos/transferencia-electoral`— a partir del volcado crudo de la tabla de
hechos.

```bash
node scripts/build-electoral-dataset.mjs ~/portafolio-data/electoral_youtube_public_fact_comments_rows.csv
```

El CSV **no va en el repositorio**: trae `author_display_name` y `text_clean`
de personas identificables junto a una clasificación política inferida por un
modelo. Vive fuera del árbol de trabajo (`~/portafolio-data/` en la máquina de
desarrollo) y `.gitignore` bloquea cualquier `*.csv` como segunda barrera.

Lo que sí se versiona es la salida: conteos, cruces y un punto por comentario
reducido a seis enteros. El script falla si detecta un nombre de autor en el
JSON que acaba de escribir.

Dos interruptores dentro del script:

- `PII` — campos que nunca se copian, ni transformados.
- `ANONYMIZE_CAMPAIGN` — en `true` neutraliza los campos que nombran campaña y
  candidatos (título del video, URL, referencia). Ponerlo en `false` devuelve
  los valores reales del CSV, que son públicos.
