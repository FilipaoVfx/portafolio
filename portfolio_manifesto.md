# Manifesto del Portfolio — Software Engineer

> **El portfolio no es una galería de proyectos. Es un sistema de evidencia de ingeniería.**

---

## 0. Propósito

Este portfolio existe para responder una pregunta:

> **¿Por qué un recruiter debería querer entrevistarme como Software Engineer?**

No busca demostrar que conozco muchas tecnologías.

Busca demostrar que puedo:

- entender problemas;
- diseñar soluciones;
- tomar decisiones técnicas;
- construir sistemas reales;
- medir resultados;
- desplegar software;
- observarlo en producción;
- explicar trade-offs;
- aprender y mejorar.

El portfolio debe convertir **proyectos personales en evidencia profesional**.

---

# 1. La filosofía

## Build → Explain → Measure → Prove

Todo proyecto importante debe seguir este ciclo:

```text
                 ┌──────────────┐
                 │    PROBLEM   │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │   SOLUTION   │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │ ARCHITECTURE │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │    BUILD     │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │    MEASURE   │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │    PROVE     │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │   IMPROVE    │
                 └──────────────┘
```

Un proyecto sin explicación es código.

Un proyecto sin métricas es una demo.

Un proyecto sin evidencia es una afirmación.

El objetivo es convertirlo en **proof of engineering**.

---

# 2. Posicionamiento

La narrativa principal del portfolio será:

> **Software Engineer focused on building full-stack, data-intensive and automated systems.**

El portfolio debe transmitir cuatro capacidades:

```text
                SOFTWARE ENGINEER
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
    FULL STACK        DATA           AI
        │              │              │
    Frontend        Ingestion       LLMs
    Backend         ETL             RAG
    APIs            Search          Agents
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                SYSTEM DESIGN
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
       DevOps      Performance   Observability
       Docker       Caching       Metrics
       CI/CD        Concurrency    Monitoring
       Cloud        Databases      Logging
```

La tecnología es el medio.

**La ingeniería es el producto.**

---

# 3. Principios

## 3.1 Problem first

Nunca comenzar un proyecto con:

> "Quería probar React."

Comenzar con:

> "Existía este problema y necesitaba esta solución."

La tecnología aparece después.

---

## 3.2 Evidence over claims

Nunca decir solamente:

> "I know distributed systems."

Mostrar:

- arquitectura;
- workers;
- colas;
- retries;
- métricas;
- código;
- decisiones;
- deployment.

La regla:

```text
Claim
  ↓
Evidence
  ↓
Proof
```

---

## 3.3 Quality over quantity

No necesitamos 20 proyectos.

Necesitamos aproximadamente:

- 3 proyectos principales;
- algunos experimentos secundarios;
- un conjunto pequeño de proyectos archivados.

Los proyectos principales deben ser profundamente explicables.

---

## 3.4 Production mindset

Siempre que sea razonable:

```text
Code
 ↓
Git
 ↓
CI/CD
 ↓
Docker
 ↓
Deployment
 ↓
Monitoring
 ↓
Production
```

El objetivo no es solamente:

> "It works on my machine."

El objetivo es:

> **"I built it, deployed it, observed it and can explain how it behaves."**

---

## 3.5 Trade-offs matter

Cada decisión técnica debe poder responder:

> Why X instead of Y?

Ejemplos:

- Why PostgreSQL instead of MongoDB?
- Why Go instead of Node?
- Why Redis?
- Why a queue?
- Why Cloudflare?
- Why Supabase?
- Why a VPS instead of a managed service?
- Why REST instead of GraphQL?
- Why RAG instead of fine-tuning?

No existe una tecnología universalmente correcta.

Existe una decisión correcta **para un contexto determinado**.

---

# 4. Arquitectura como lenguaje

La arquitectura será una parte central del portfolio.

Cada proyecto relevante debería poder expresarse visualmente:

```text
                     CLIENT
                       │
                       ▼
                 ┌───────────┐
                 │ Cloudflare│
                 └─────┬─────┘
                       │
                       ▼
                 ┌───────────┐
                 │    API    │
                 └─────┬─────┘
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
      PostgreSQL     Redis       Queue
          │                         │
          │                         ↓
          │                       Workers
          │                         │
          └────────────┬────────────┘
                       ↓
                Observability
               Prometheus/Grafana
```

La arquitectura debe explicar:

- componentes;
- responsabilidades;
- flujo de datos;
- dependencias;
- límites del sistema;
- puntos de fallo;
- decisiones importantes.

---

# 5. Cada proyecto debe contar una historia

La estructura mínima será:

```text
01. Problem
02. Context
03. Solution
04. Architecture
05. Technology choices
06. Implementation
07. Trade-offs
08. Performance
09. Testing
10. Deployment
11. Observability
12. Results
13. Lessons learned
14. Future improvements
```

---

# 6. Problem

Responder:

> **¿Qué problema estamos resolviendo?**

Debe ser concreto.

### Malo

> A web app for managing data.

### Bueno

> Developers were manually collecting and organizing technical resources from multiple sources. The system automates ingestion, normalization and search.

El recruiter debe entender el problema sin conocer el proyecto.

---

# 7. Solution

Explicar:

> **¿Qué construí exactamente?**

Debe poder resumirse en una frase.

Ejemplo:

> An automated indexing platform that collects, processes, stores and searches technical resources from multiple sources.

---

# 8. Architecture

Mostrar:

- diagrama;
- componentes;
- flujo;
- infraestructura;
- decisiones.

El diagrama no debe ser decoración.

Debe ayudar a responder:

> **How does the system actually work?**

---

# 9. Technology choices

No presentar únicamente:

```text
React
Go
PostgreSQL
Redis
Docker
Cloudflare
```

Presentar:

```text
Technology       Reason
────────────────────────────────────
React            Interactive UI
Go               Concurrent workers
PostgreSQL       Relational persistence
Redis            Caching / temporary state
Docker           Reproducible deployment
Cloudflare        Edge / DNS / caching
Prometheus        Metrics
Grafana           Visualization
```

La tecnología debe estar conectada con una necesidad.

---

# 10. Data Engineering

Los proyectos de datos deben demostrar:

- ingestion;
- scraping;
- normalization;
- validation;
- transformation;
- indexing;
- storage;
- search;
- asynchronous processing.

Ejemplo:

```text
External Sources
      ↓
    Fetch
      ↓
   Validate
      ↓
 Normalize
      ↓
    Queue
      ↓
   Workers
      ↓
 PostgreSQL
      ↓
 Search Index
      ↓
    Client
```

No mostrar solamente el scraper.

Mostrar el **sistema de ingestión completo**.

---

# 11. AI Engineering

AI debe presentarse como ingeniería, no como una colección de APIs.

Conceptos relevantes:

```text
LLM
 ↓
Prompt
 ↓
Structured Output
 ↓
Tools
 ↓
RAG
 ↓
Vector Search
 ↓
Evaluation
 ↓
Observability
```

Cada uso de AI debe responder:

1. Why AI?
2. Why this model?
3. What context does it receive?
4. How is hallucination handled?
5. How is output validated?
6. How is performance measured?
7. What happens when the model fails?

---

# 12. Performance

Cada proyecto debería intentar medir algo.

Ejemplos:

- latency;
- throughput;
- requests/sec;
- memory usage;
- CPU usage;
- bundle size;
- Lighthouse;
- cache hit ratio;
- database query time;
- processing time;
- deployment time.

Ejemplo:

```text
Before
API latency: 420ms

Optimization
Added Redis caching

After
API latency: 85ms

Improvement
≈ 80%
```

Los números convierten una afirmación en evidencia.

---

# 13. Scalability

No afirmar:

> "This system is scalable."

Explicar:

> **¿Qué ocurriría si el tráfico se multiplicara por 10?**

Considerar:

- horizontal scaling;
- stateless services;
- queues;
- workers;
- caching;
- database indexes;
- connection pooling;
- rate limiting;
- CDN;
- load balancing.

También explicar cuándo **no** vale la pena escalar.

---

# 14. Reliability

Demostrar que el sistema contempla fallos.

Preguntas:

- What happens if the API fails?
- What happens if a worker crashes?
- What happens if an external API is unavailable?
- Are jobs retryable?
- Is the operation idempotent?
- What happens to corrupted data?
- How is failure observed?

Conceptos:

```text
Retries
Timeouts
Backoff
Circuit breakers
Idempotency
Dead-letter queues
Health checks
Graceful degradation
```

No es necesario implementar todos.

Es necesario demostrar que se entiende el problema.

---

# 15. Security

Cada proyecto debe considerar, cuando aplique:

- authentication;
- authorization;
- secrets;
- environment variables;
- input validation;
- rate limiting;
- CORS;
- HTTPS;
- dependency security;
- least privilege.

Nunca publicar:

```text
API_KEY=xxxxxxxx
DATABASE_PASSWORD=xxxxxxxx
```

El portfolio también es una demostración de criterio.

---

# 16. Testing

Mostrar una estrategia, no solamente cobertura.

```text
Unit Tests
     ↓
Integration Tests
     ↓
API Tests
     ↓
E2E Tests
     ↓
Production Monitoring
```

Explicar qué se prueba y por qué.

---

# 17. DevOps

El portfolio debe demostrar capacidad de llevar código hacia producción.

```text
Developer
    ↓
Git
    ↓
Pull Request
    ↓
CI
    ↓
Tests
    ↓
Build
    ↓
Docker
    ↓
Deploy
    ↓
Production
    ↓
Monitoring
```

Conceptos:

- Git;
- CI/CD;
- Docker;
- reverse proxy;
- VPS/cloud;
- DNS;
- CDN;
- environment management;
- deployment strategies;
- rollback.

---

# 18. Observability

No basta con desplegar.

Hay que poder responder:

> **What is happening inside the system?**

Tres pilares:

```text
Logs
Metrics
Traces
```

Ejemplo:

```text
Application
     │
     ├── Logs
     ├── Metrics
     └── Traces
             │
             ↓
       Observability
             │
        Prometheus
             │
          Grafana
```

---

# 19. GitHub como evidencia

Cada proyecto principal debe tener un README profesional.

Estructura:

```text
# Project Name

## Overview

## Problem

## Solution

## Architecture

## Features

## Tech Stack

## Technical Decisions

## Trade-offs

## Performance

## Testing

## Deployment

## Observability

## Local Development

## Screenshots / Demo

## Lessons Learned

## Future Improvements
```

El README debe ser capaz de sobrevivir sin el portfolio.

---

# 20. ADRs

Las decisiones importantes deben documentarse.

Ejemplo:

```text
docs/
└── adr/
    ├── 001-database-choice.md
    ├── 002-cache-strategy.md
    ├── 003-backend-language.md
    └── 004-deployment-strategy.md
```

Formato:

```text
# ADR-002: Cache Strategy

## Context

...

## Decision

...

## Alternatives

...

## Trade-offs

...

## Consequences

...
```

Esto transforma el repositorio en evidencia de **system design**.

---

# 21. Los tres proyectos principales

El portfolio debería tener tres pilares.

## Project 01 — Data / Search

Debe demostrar:

- ingestion;
- scraping;
- ETL;
- databases;
- search;
- concurrency;
- architecture.

Narrativa:

> **Building systems that turn fragmented information into searchable data.**

---

## Project 02 — Full-Stack / SaaS

Debe demostrar:

- frontend;
- backend;
- APIs;
- authentication;
- database;
- UX;
- deployment.

Narrativa:

> **Building complete products from interface to infrastructure.**

---

## Project 03 — AI / Automation

Debe demostrar:

- LLMs;
- agents;
- RAG;
- workflows;
- APIs;
- automation;
- evaluation.

Narrativa:

> **Building intelligent systems that automate operational workflows.**

---

# 22. La homepage

La homepage debe ser extremadamente clara.

Orden recomendado:

```text
┌─────────────────────────────────────┐
│                                     │
│       NAME / SOFTWARE ENGINEER      │
│                                     │
│ Full-stack · Data · AI · Systems    │
│                                     │
│ [GitHub] [LinkedIn] [Resume]        │
│                                     │
└─────────────────────────────────────┘

             SELECTED WORK

┌─────────────────────────────────────┐
│ Project 01                          │
│ Data / Search                       │
│ Architecture · Performance · Data   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Project 02                          │
│ Full Stack                          │
│ Product · APIs · Infrastructure     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Project 03                          │
│ AI / Automation                     │
│ LLM · RAG · Agents · Workflows      │
└─────────────────────────────────────┘

             ENGINEERING

Architecture · DevOps · Data · AI
Performance · Testing · Observability

             EXPERIENCE

             CONTACT
```

---

# 23. Visual design

El diseño debe apoyar la percepción de ingeniería.

Principios:

- minimalismo;
- excelente tipografía;
- jerarquía clara;
- animaciones con propósito;
- arquitectura visual;
- screenshots reales;
- métricas visibles;
- terminal/code aesthetic cuando aporte;
- responsive;
- performance first.

Evitar:

- exceso de gradients;
- demasiadas animaciones;
- barras de porcentaje;
- "90% React";
- logos flotando sin contexto;
- 20 cards;
- frases genéricas;
- walls of text.

---

# 24. Performance del propio portfolio

El portfolio también es un proyecto de ingeniería.

Debe aspirar a:

```text
Fast
Accessible
Responsive
SEO-friendly
Mobile-first
Observable
Secure
```

Medir:

- Core Web Vitals;
- Lighthouse;
- bundle size;
- image optimization;
- loading performance;
- caching.

Una contradicción sería:

> "Performance-focused engineer"

con un portfolio que tarda 8 segundos en cargar.

---

# 25. Recruiter Mode

El portfolio debe funcionar para dos públicos.

## Recruiter no técnico

Debe descubrir rápidamente:

- quién eres;
- qué haces;
- qué tecnologías utilizas;
- qué proyectos tienes;
- cómo contactarte.

## Recruiter / Engineer técnico

Debe poder profundizar:

```text
Project
   ↓
README
   ↓
Architecture
   ↓
Code
   ↓
ADR
   ↓
Metrics
   ↓
Deployment
```

La navegación debe permitir ambos niveles.

---

# 26. Interview Mode

Cada proyecto debe ser una fuente de preguntas de entrevista.

Si el portfolio dice:

> "Implemented Redis caching."

Debes estar preparado para:

- Why Redis?
- What did you cache?
- TTL?
- Cache invalidation?
- What happens when Redis fails?
- What is the hit ratio?
- Why not CDN?
- Why not PostgreSQL?
- How does this affect consistency?

El portfolio no debe contener afirmaciones que no puedas defender.

---

# 27. Seniority Signal

El portfolio debe mostrar progresivamente:

```text
Junior signal
"I can code."

        ↓

Mid-level signal
"I can build features."

        ↓

Strong engineer
"I can design systems."

        ↓

Senior signal
"I can make trade-offs."

        ↓

Staff-level signal
"I can reason about systems,
constraints and organizational impact."
```

No intentar parecer senior artificialmente.

Mostrar evidencia del nivel real.

---

# 28. Métrica de calidad del portfolio

Cada proyecto puede evaluarse con este checklist:

```text
[ ] Problem clearly defined
[ ] Solution clearly defined
[ ] Architecture diagram
[ ] Technology rationale
[ ] Trade-offs documented
[ ] Code available
[ ] README available
[ ] Tests
[ ] Deployment
[ ] Performance metrics
[ ] Observability
[ ] Security considerations
[ ] Lessons learned
[ ] Future improvements
[ ] Live demo
```

No todos los proyectos necesitan marcar todas las casillas.

Los **3 proyectos principales sí deberían acercarse a este estándar**.

---

# 29. Anti-patterns

El portfolio NO debe convertirse en:

### Technology museum

```text
React
Vue
Angular
Svelte
Next
Nuxt
Go
Rust
Java
Python
...
```

### GitHub mirror

Mostrar repositorios sin explicar impacto.

### Tutorial cemetery

20 clones de tutoriales.

### Design showcase

Una UI preciosa sin demostrar ingeniería.

### AI wrapper

Una interfaz llamando a una API de LLM sin arquitectura ni evaluación.

### Buzzword soup

```text
Cloud Native
AI
Blockchain
Microservices
Big Data
DevOps
Distributed Systems
```

sin evidencia.

---

# 30. La regla de oro

Antes de agregar algo al portfolio preguntar:

> **¿Esto aumenta la evidencia de que soy un buen Software Engineer?**

Si la respuesta es no:

**eliminar.**

---

# 31. Definition of Done

El portfolio estará listo cuando un recruiter pueda:

### En 10 segundos

Entender quién soy.

### En 30 segundos

Entender qué tipo de developer soy.

### En 2 minutos

Ver mis mejores proyectos.

### En 5 minutos

Entender cómo pienso técnicamente.

### En 10 minutos

Explorar arquitectura, código y decisiones.

### En 15 minutos

Tener suficientes razones para querer entrevistarme.

---

# 32. La narrativa final

El portfolio debe contar esta historia:

```text
                    WHO AM I?
                        ↓
              Software Engineer
                        ↓
              WHAT DO I BUILD?
                        ↓
       Full-stack · Data · AI Systems
                        ↓
             HOW DO I BUILD IT?
                        ↓
       Architecture · Engineering
                        ↓
             WHY THESE CHOICES?
                        ↓
              Trade-offs · ADRs
                        ↓
              DOES IT ACTUALLY WORK?
                        ↓
          Production · Metrics · Demo
                        ↓
               CAN I DEFEND IT?
                        ↓
                   GitHub
                        ↓
                 INTERVIEW
```

---

# 33. Manifiesto

> **No quiero que mi portfolio diga que sé programar.**
>
> Quiero que demuestre cómo pienso cuando tengo que construir software.
>
> No quiero mostrar únicamente tecnologías.
>
> Quiero mostrar por qué las elegí.
>
> No quiero mostrar únicamente interfaces.
>
> Quiero mostrar los sistemas que existen detrás de ellas.
>
> No quiero decir que entiendo arquitectura.
>
> Quiero mostrarla.
>
> No quiero afirmar que optimizo sistemas.
>
> Quiero mostrar las métricas.
>
> No quiero decir que conozco DevOps.
>
> Quiero mostrar el camino desde el commit hasta producción.
>
> No quiero decir que sé trabajar con AI.
>
> Quiero mostrar cómo diseño, valido y observo sistemas basados en AI.
>
> No quiero esconder los trade-offs.
>
> Quiero documentarlos.
>
> No quiero llenar el portfolio de proyectos.
>
> Quiero construir pocos proyectos que puedan resistir una entrevista técnica.
>
> **El portfolio no es el producto.**
>
> **El portfolio es la evidencia.**
>
> **El producto soy yo como ingeniero.**

---

# 34. North Star

La pregunta que debe guiar cada decisión:

> ### "If a strong engineer reviewed this portfolio, would they see evidence of engineering judgment?"

Si la respuesta es **sí**, estamos construyendo el portfolio correcto.

Si la respuesta es **no**, no necesitamos más features.

Necesitamos **mejor evidencia**.
