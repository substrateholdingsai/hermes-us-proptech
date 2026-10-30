export const openApiSpec: Record<string, unknown> = {
  openapi: '3.1.0',
  info: {
    title: 'Hermes US PropTech & VEKTOR Intelligence API',
    version: '1.0.0',
    description:
      'API B2B para inteligencia inmobiliaria, resolucion de entidades (LLC/Trust/UBO), validacion SEC/FINRA, skip-trace TCPA-compliant, analisis de equity y generacion de dossiers ejecutivos en PDF. Autenticacion mediante Bearer API Key por tenant. Los endpoints de inteligencia consumen creditos segun el oraculo invocado.',
    contact: { name: 'Hermes US PropTech', url: 'https://hermes-us-proptech.arksystems.site' },
  },
  servers: [
    { url: 'https://hermes-us-proptech.arksystems.site', description: 'Production' },
    { url: 'http://localhost:8787', description: 'Local Development' },
  ],
  security: [{ BearerAuth: [] }],
  tags: [
    { name: 'Intelligence Oracles', description: 'Oraculos de inteligencia (consumen creditos)' },
    { name: 'Intelligence Explorer', description: 'Consultas y explorador de datos resueltos' },
    { name: 'Credits & Reports', description: 'Creditos, dossiers y descargas' },
    { name: 'Health', description: 'Estado operacional' },
  ],
  paths: {
    '/api/v1/intelligence/entity-resolution': {
      post: {
        tags: ['Intelligence Oracles'],
        summary: 'Resolucion de entidades (LLC, Trust, UBO)',
        description: 'Resuelve LLCs, Trusts y UBO en Delaware, Wyoming, Nevada, Florida y Texas. Costo: 5 creditos.',
        operationId: 'entityResolution',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EntityResolutionRequest' },
              example: { entityName: 'Acme Holdings LLC', state: 'DE', customPrompt: '' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OracleResponse' },
                example: { ok: true, job: { id: 'job_123', taskType: 'entity_resolution', status: 'completed' }, creditBalance: 995 },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '402': { $ref: '#/components/responses/InsufficientCredits' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/intelligence/property-equity': {
      post: {
        tags: ['Intelligence Oracles'],
        summary: 'Analisis de equity inmobiliario',
        description: 'Catastro, tasacion de mercado, balance hipotecario y calculo de equity. Costo: 8 creditos.',
        operationId: 'propertyEquity',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PropertyEquityRequest' },
              example: { propertyAddress: '123 Main St, Miami, FL', state: 'FL' },
            },
          },
        },
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/OracleResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '402': { $ref: '#/components/responses/InsufficientCredits' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/intelligence/sec-validation': {
      post: {
        tags: ['Intelligence Oracles'],
        summary: 'Validacion SEC / FINRA',
        description: 'Validacion de Reg D (Form D), Form ADV (RIAs) y licencias FINRA Series 7/65 (Regla 501(a)(10)). Costo: 3 creditos.',
        operationId: 'secValidation',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SecValidationRequest' },
              example: { subjectName: 'John Doe', entityName: 'Acme Capital LLC' },
            },
          },
        },
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/OracleResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '402': { $ref: '#/components/responses/InsufficientCredits' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/intelligence/skip-trace': {
      post: {
        tags: ['Intelligence Oracles'],
        summary: 'Skip-trace TCPA-compliant',
        description: 'Carrier Lookup (Mobile vs Landline), DNC scrubbing nacional y verificacion de email via Cloudflare DoH. Costo: 10 creditos.',
        operationId: 'skipTrace',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SkipTraceRequest' },
              example: { subjectName: 'Jane Roe', propertyAddress: '456 Oak Ave, Dallas, TX' },
            },
          },
        },
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/OracleResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '402': { $ref: '#/components/responses/InsufficientCredits' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      get: {
        tags: ['Intelligence Explorer'],
        summary: 'Registros de skip-trace',
        description: 'Lista paginada de registros telefonicos y correos verificados.',
        operationId: 'listSkipTrace',
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/Limit' }, { $ref: '#/components/parameters/Offset' }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedSkipTrace' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/intelligence/entities': {
      get: {
        tags: ['Intelligence Explorer'],
        summary: 'Lista de entidades y UBOs resueltos',
        description: 'Lista paginada de entidades y UBOs resueltos.',
        operationId: 'listEntities',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/Limit' },
          { $ref: '#/components/parameters/Offset' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Filtro por nombre de entidad' },
          { name: 'state', in: 'query', schema: { type: 'string', enum: ['DE', 'WY', 'NV', 'FL', 'TX'] }, description: 'Estado de formacion' },
        ],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedEntities' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/intelligence/entities/{id}': {
      get: {
        tags: ['Intelligence Explorer'],
        summary: 'Detalle de entidad',
        description: 'Detalle completo de una entidad y su arbol de control.',
        operationId: 'getEntity',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/EntityDetail' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/intelligence/properties': {
      get: {
        tags: ['Intelligence Explorer'],
        summary: 'Lista de inmuebles analizados',
        description: 'Lista de inmuebles analizados con desglose de equity.',
        operationId: 'listProperties',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/Limit' },
          { $ref: '#/components/parameters/Offset' },
          { name: 'county', in: 'query', schema: { type: 'string' } },
          { name: 'state', in: 'query', schema: { type: 'string' } },
          { name: 'minEquity', in: 'query', schema: { type: 'number' } },
        ],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedProperties' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/intelligence/investors': {
      get: {
        tags: ['Intelligence Explorer'],
        summary: 'Perfiles de inversores',
        description: 'Perfiles de inversores acreditados / QP.',
        operationId: 'listInvestors',
        security: [{ BearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/Limit' },
          { $ref: '#/components/parameters/Offset' },
          { name: 'investor_type', in: 'query', schema: { type: 'string' } },
          { name: 'sec_form_d', in: 'query', schema: { type: 'integer', enum: [0, 1] } },
        ],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedInvestors' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/intelligence/audit-logs': {
      get: {
        tags: ['Intelligence Explorer'],
        summary: 'Trazabilidad de operaciones',
        description: 'Trazabilidad completa de operaciones.',
        operationId: 'listAuditLogs',
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/Limit' }, { $ref: '#/components/parameters/Offset' }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedAuditLogs' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/intelligence/tenant/credits': {
      get: {
        tags: ['Credits & Reports'],
        summary: 'Balance de creditos y plan',
        description: 'Balance actual de creditos y plan activo.',
        operationId: 'getTenantCredits',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/TenantCredits' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/intelligence/reports/generate': {
      post: {
        tags: ['Credits & Reports'],
        summary: 'Generar dossier ejecutivo PDF',
        description: 'Compilacion de Dossier Ejecutivo en PDF.',
        operationId: 'generateReport',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GenerateReportRequest' },
              example: { subjectName: 'Acme LLC', propertyAddress: '123 Main St, Miami, FL' },
            },
          },
        },
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/GenerateReportResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/intelligence/reports/{reportId}/download': {
      get: {
        tags: ['Credits & Reports'],
        summary: 'Descargar PDF',
        description: 'Descarga y streaming del PDF desde Cloudflare R2.',
        operationId: 'downloadReport',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'reportId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'PDF stream',
            content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Estado operacional',
        description: 'Estado operacional del servicio.',
        operationId: 'health',
        security: [],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { ok: { type: 'boolean' }, service: { type: 'string' } },
                },
                example: { ok: true, service: 'hermes-us-proptech' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API-Key',
        description: 'API Key de Hermes (ej. hermes_dev_secret_key_2026)',
      },
    },
    parameters: {
      Limit: { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, minimum: 1 }, description: 'Tamano de pagina' },
      Offset: { name: 'offset', in: 'query', schema: { type: 'integer', default: 0, minimum: 0 }, description: 'Desplazamiento' },
    },
    responses: {
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorUnauthorized' },
            example: { ok: false, error: 'unauthorized', message: 'Missing or invalid API key' },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorForbidden' },
            example: { ok: false, error: 'forbidden', message: 'Insufficient scope' },
          },
        },
      },
      InsufficientCredits: {
        description: 'Insufficient Credits',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorInsufficientCredits' },
            example: { ok: false, error: 'insufficient_credits', required: 5, currentBalance: 2 },
          },
        },
      },
      NotFound: {
        description: 'Not Found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorNotFound' },
            example: { ok: false, error: 'not_found' },
          },
        },
      },
    },
    schemas: {
      EntityResolutionRequest: {
        type: 'object',
        required: ['entityName', 'state'],
        properties: {
          entityName: { type: 'string' },
          state: { type: 'string', enum: ['DE', 'WY', 'NV', 'FL', 'TX'] },
          customPrompt: { type: 'string' },
        },
      },
      PropertyEquityRequest: {
        type: 'object',
        required: ['propertyAddress'],
        properties: {
          propertyAddress: { type: 'string' },
          state: { type: 'string' },
          customPrompt: { type: 'string' },
        },
      },
      SecValidationRequest: {
        type: 'object',
        properties: {
          subjectName: { type: 'string' },
          entityName: { type: 'string' },
          customPrompt: { type: 'string' },
        },
      },
      SkipTraceRequest: {
        type: 'object',
        required: ['subjectName'],
        properties: {
          subjectName: { type: 'string' },
          propertyAddress: { type: 'string' },
          customPrompt: { type: 'string' },
        },
      },
      GenerateReportRequest: {
        type: 'object',
        properties: {
          jobId: { type: 'string' },
          subjectName: { type: 'string' },
          propertyAddress: { type: 'string' },
        },
      },
      IntelJob: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          taskType: { type: 'string' },
          status: { type: 'string' },
        },
      },
      OracleResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          job: { $ref: '#/components/schemas/IntelJob' },
          creditBalance: { type: 'number' },
        },
      },
      EntityLookup: { type: 'object', additionalProperties: true },
      PropertyRecord: { type: 'object', additionalProperties: true },
      InvestorProfile: { type: 'object', additionalProperties: true },
      SkipTraceRecord: { type: 'object', additionalProperties: true },
      AuditLog: { type: 'object', additionalProperties: true },
      PaginatedEntities: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          items: { type: 'array', items: { $ref: '#/components/schemas/EntityLookup' } },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
        },
      },
      PaginatedProperties: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          items: { type: 'array', items: { $ref: '#/components/schemas/PropertyRecord' } },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
        },
      },
      PaginatedInvestors: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          items: { type: 'array', items: { $ref: '#/components/schemas/InvestorProfile' } },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
        },
      },
      PaginatedSkipTrace: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          items: { type: 'array', items: { $ref: '#/components/schemas/SkipTraceRecord' } },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
        },
      },
      PaginatedAuditLogs: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          items: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
        },
      },
      TenantCredits: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          balance: { type: 'number' },
          transactions: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
      },
      GenerateReportResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          reportId: { type: 'string' },
          downloadUrl: { type: 'string' },
        },
      },
      EntityDetail: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          item: { $ref: '#/components/schemas/EntityLookup' },
        },
      },
      ErrorUnauthorized: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
      ErrorForbidden: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
      ErrorInsufficientCredits: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          error: { type: 'string' },
          required: { type: 'number' },
          currentBalance: { type: 'number' },
        },
      },
      ErrorNotFound: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          error: { type: 'string' },
        },
      },
    },
  },
};
