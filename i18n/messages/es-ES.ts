import { ES_ES_DROP_REACTION_MESSAGES } from "@/i18n/messages/drop-reactions";
import { ES_ES_NEW_VERSION_TOAST_MESSAGES } from "@/i18n/messages/new-version-toast";
import { ES_ES_QR_SCANNER_MESSAGES } from "@/i18n/messages/qr-scanner";
import { ES_ES_CAPACITOR_CONNECT_MESSAGES } from "@/i18n/messages/capacitor-connect";
import { ES_ES_PAGINATION_MESSAGES } from "@/i18n/messages/pagination";
import { ES_ES_THE_MEMES_COLLECTORS_MESSAGES } from "@/i18n/messages/the-memes-collectors";
import { ES_ES_TRANSFER_MESSAGES } from "@/i18n/messages/transfer";
import stormComposerEsMessages from "@/i18n/messages/stormComposer.es-ES.json";
import type { MessageKey } from "@/i18n/messages/en-US";

export const ES_ES_MESSAGES = {
  "network.groupInspection.bulkRep":
    "Dar REP a todos los perfiles que cumplen los criterios",
  "network.groupInspection.bulkNic":
    "Dar NIC a todos los perfiles que cumplen los criterios",
  "network.groupInspection.bulkActionsLabel": "Acciones de valoración masiva",
  "network.groupInspection.bulkRepSuccess": "REP distribuido.",
  "network.groupInspection.bulkNicSuccess": "NIC distribuido.",
  "network.groupInspection.source": "Fuente: filtros y lista manual opcional",
  "user.brain.sidebar.createdHeading": "Waves creadas",
  "user.brain.sidebar.createdMobileHeading": "Creadas",
  "user.brain.sidebar.recentlyActiveHeading": "Actividad reciente en",
  "user.brain.sidebar.lastPost": "Última publicación {time}",
  "user.brain.sidebar.noPostsByProfile": "Este perfil no tiene publicaciones",
  "user.brain.sidebar.totalWavePosts.one":
    "{count} publicación total en la Wave",
  "user.brain.sidebar.totalWavePosts.other":
    "{count} publicaciones totales en la Wave",
  "user.brain.sidebar.privateWave": "Wave privada",
  "user.brain.sidebar.loadingWaveActivity":
    "Cargando la actividad del perfil en Waves",
  "user.brain.sidebar.loadingMoreWaveActivity":
    "Cargando más actividad del perfil en Waves",
  "user.brain.sidebar.desktopScrollRegionLabel": "Waves del Brain",
  "user.brain.sidebar.mobileStripLabel": "Waves del Brain",
  "user.brain.sidebar.createdEmpty": "No hay Waves creadas accesibles.",
  "user.brain.sidebar.recentEmpty": "No hay publicaciones recientes en Waves.",
  "user.brain.sidebar.createdLoadError":
    "No se pudieron cargar las Waves creadas.",
  "user.brain.sidebar.recentLoadError":
    "No se pudo cargar la actividad reciente en Waves.",
  "user.brain.sidebar.loadMoreError": "No se pudieron cargar más Waves.",
  "user.brain.sidebar.retry": "Reintentar",
  "user.brain.sidebar.retryLoadMore": "Reintentar cargar más",
  "user.brain.sidebar.loadMore": "Cargar más",
  "user.brain.sidebar.loadingMore": "Cargando…",
  "user.brain.sidebar.allWavesLoaded": "Todas las Waves están cargadas.",
  "user.brain.sidebar.more": "Más",
  "user.brain.sidebar.showLess": "Mostrar menos",
  "user.brain.sidebar.showMore": "Mostrar más",
  "user.brain.sidebar.viewMoreCreatedWaves": "Ver más Waves creadas",
  "user.brain.sidebar.createdModalTitle": "Waves creadas por {profile}",
  "user.brain.sidebar.loadedCreatedCount.one": "Mostrando {count} Wave cargada",
  "user.brain.sidebar.loadedCreatedCount.other":
    "Mostrando {count} Waves cargadas",
  "user.brain.sidebar.createdCount.one": "{count} Wave creada",
  "user.brain.sidebar.createdCount.other": "{count} Waves creadas",
  "user.brain.sidebar.closeCreatedWaves": "Cerrar las Waves creadas",
  "linkPreview.twitter.kind.article": "Artículo",
  "linkPreview.twitter.kind.post": "Publicación",
  "linkPreview.twitter.article.provider": "Artículo en X",
  "linkPreview.twitter.article.read": "Leer artículo: {title}",
  "waves.drop.actions.copyText": "Copiar texto",
  "waves.drop.actions.copyLink": "Copiar enlace",
  "waves.drop.actions.copied": "Copiado!",
  "waves.drop.actions.copyFailed": "No se pudo copiar",
  "waves.drop.actions.menuLabel": "Acciones del drop",
  "waves.drop.actions.reactionPickerLabel": "Añadir una reacción al drop",
  "media.video.captions": "Subtitulos",
  "media.video.download": "Descargar multimedia",
  "media.video.downloading": "Descargando multimedia",
  "media.video.exitFullscreen": "Salir de pantalla completa",
  "media.video.fullscreen": "Pantalla completa",
  "media.video.mute": "Silenciar video",
  "media.video.pause": "Pausar video",
  "media.video.play": "Reproducir video",
  "media.video.player": "Reproductor de video",
  "media.video.playPreview": "Reproducir vista previa del video",
  "media.video.seek": "Cambiar la posicion del video",
  "media.video.unmute": "Activar sonido del video",
  "media.video.unsupported": "Tu navegador no admite la etiqueta de video.",
  "attachment.safety.ariaLabel": "Adjunto escaneado y validado",
  "attachment.safety.badge": "Escaneado y validado",
  "attachment.safety.heading": "Seguridad del adjunto",
  "attachment.safety.hideDetails": "Ocultar detalles de seguridad",
  "attachment.safety.sha256": "SHA-256",
  "attachment.safety.size": "Tamaño {size}",
  "attachment.safety.viewDetails": "Ver detalles de seguridad",
  "linkPreview.collection.maximumEdition": "Edición máxima",
  "linkPreview.collection.minted": "Acuñados",
  "linkPreview.collection.mintingLive": "Acuñación activa",
  "linkPreview.file.externalSource": "Fuente externa",
  "linkPreview.file.fact.mime": "MIME",
  "linkPreview.file.fact.size": "Tamaño",
  "linkPreview.file.kind.archive": "Archivo",
  "linkPreview.file.kind.audio": "Audio",
  "linkPreview.file.kind.binary": "Binario",
  "linkPreview.file.kind.code": "Código",
  "linkPreview.file.kind.csv": "CSV",
  "linkPreview.file.kind.document": "Documento",
  "linkPreview.file.kind.image": "Imagen",
  "linkPreview.file.kind.pdf": "PDF",
  "linkPreview.file.kind.presentation": "Presentación",
  "linkPreview.file.kind.spreadsheet": "Hoja de cálculo",
  "linkPreview.file.kind.text": "Texto",
  "linkPreview.file.kind.unknown": "Desconocido",
  "linkPreview.file.kind.video": "Vídeo",
  "linkPreview.file.openSource": "Abrir fuente",
  "linkPreview.file.size.unit.B": "B",
  "linkPreview.file.size.unit.GB": "GB",
  "linkPreview.file.size.unit.KB": "KB",
  "linkPreview.file.size.unit.MB": "MB",
  "linkPreview.file.size.value": "{value} {unit}",
  "linkPreview.github.fact.mime": "MIME",
  "linkPreview.github.fact.type": "Tipo",
  "linkPreview.github.fileKind": "Archivo {kind}",
  "linkPreview.etherscan.provider": "Etherscan",
  "linkPreview.etherscan.previewLabel":
    "Vista previa de {kind} de Etherscan en {network}",
  "linkPreview.etherscan.open": "Abrir en Etherscan",
  "linkPreview.etherscan.copy": "Copiar {kind}",
  "linkPreview.etherscan.copied": "{kind} copiado",
  "linkPreview.etherscan.copyFailed": "No se pudo copiar {kind}",
  "linkPreview.etherscan.retry": "Reintentar",
  "linkPreview.etherscan.loading": "Cargando vista previa de Etherscan",
  "linkPreview.etherscan.partial":
    "Algunos datos en directo no están disponibles",
  "linkPreview.etherscan.liveUnavailable": "Datos en directo no disponibles",
  "linkPreview.etherscan.legacy":
    "Red histórica: los datos en directo no están disponibles para este explorador archivado.",
  "linkPreview.etherscan.status.success": "Correcta",
  "linkPreview.etherscan.status.pending": "Pendiente",
  "linkPreview.etherscan.status.reverted": "Revertida",
  "linkPreview.etherscan.status.finalized": "Finalizado",
  "linkPreview.etherscan.status.proposed": "Propuesto",
  "linkPreview.etherscan.status.future": "Bloque futuro",
  "linkPreview.etherscan.status.unknown": "Estado no disponible",
  "linkPreview.etherscan.action.nativeTransfer": "{value} ETH enviados",
  "linkPreview.etherscan.action.tokenTransfer": "Transferencia de token",
  "linkPreview.etherscan.action.contractCreation": "Contrato creado",
  "linkPreview.etherscan.action.contractInteraction":
    "Interacción con contrato",
  "linkPreview.etherscan.action.transaction": "Transacción de Ethereum",
  "linkPreview.etherscan.action.compound":
    "Compound {action}: {amount} {token}",
  "linkPreview.etherscan.description.tool":
    "Enlace de solo lectura a una herramienta de Etherscan. 6529 no envía su formulario.",
  "linkPreview.etherscan.description.unknown":
    "Una página de Etherscan. Ábrela para consultar la ruta completa.",
  "profileCms.block.audioUnavailable": "Audio no disponible",
  "profileCms.block.collectionFallback": "Colección",
  "profileCms.block.galleryUnavailable": "Galería no disponible",
  "profileCms.block.imageUnavailable": "Imagen no disponible",
  "profileCms.block.linkUnavailable": "Enlace no disponible",
  "profileCms.block.nftReferenceUnavailable": "Referencia de NFT no disponible",
  "profileCms.block.openLink": "Abrir enlace",
  "profileCms.block.transactionFallback": "Transacción",
  "profileCms.block.unsupported": "Bloque no compatible",
  "profileCms.block.videoUnavailable": "Vídeo no disponible",
  "profileCms.builder.agent.error.baseHashMismatch":
    "El hash de paquete destino del parche no coincide con el borrador actual.",
  "profileCms.builder.agent.error.baseHashMissing":
    "Se requiere el hash de paquete destino del parche.",
  "profileCms.builder.agent.error.baseVersionMismatch":
    "La versión base destino del parche está desactualizada para el borrador actual.",
  "profileCms.builder.agent.error.blockDuplicateId":
    "El id de bloque {id} ya existe en este borrador.",
  "profileCms.builder.agent.error.blockFieldUnsupported":
    "El campo de bloque {field} no se puede editar con parches de agente.",
  "profileCms.builder.agent.error.blockStructuralMix":
    "Las operaciones de bloques estructurales no se pueden combinar con otras mutaciones de bloques en un parche.",
  "profileCms.builder.agent.error.codeLabel": "Código: {code}",
  "profileCms.builder.agent.error.jsonInvalid":
    "No se pudo analizar el JSON del parche.",
  "profileCms.builder.agent.error.metadataFieldUnsupported":
    "El campo de metadatos {field} no se puede editar con parches de agente.",
  "profileCms.builder.agent.error.navigationMissing":
    "El borrador del constructor no contiene un elemento de navegación editable.",
  "profileCms.builder.agent.error.operationUnsupported":
    "La revisión del constructor no soporta {op}.",
  "profileCms.builder.agent.error.pageMissing":
    "El borrador del constructor no contiene una página de inicio editable.",
  "profileCms.builder.agent.error.pathUnsupported":
    "La revisión del constructor no puede aplicar la ruta {path}.",
  "profileCms.builder.agent.error.schemaInvalid":
    "El JSON del parche no coincide con el esquema de parche del agente.",
  "profileCms.builder.agent.error.targetDraftMismatch":
    "El id de borrador destino del parche no coincide con el borrador actual.",
  "profileCms.builder.agent.error.validationRejected":
    "La validación local del paquete rechazó este cambio ({code}).",
  "profileCms.builder.agent.error.valueInvalid":
    "El valor del parche no es válido para esta operación.",
  "profileCms.builder.agent.packet.authorCopy": "Copia del autor",
  "profileCms.builder.agent.packet.derivedMetadata": "Metadatos derivados",
  "profileCms.builder.agent.packet.facts": "Hechos",
  "profileCms.builder.agent.packet.label.assets": "Activos",
  "profileCms.builder.agent.packet.label.baseVersion": "Versión base",
  "profileCms.builder.agent.packet.label.blocks": "Bloques",
  "profileCms.builder.agent.packet.label.canonical": "Canónico",
  "profileCms.builder.agent.packet.label.draft": "Borrador",
  "profileCms.builder.agent.packet.label.issues": "Problemas",
  "profileCms.builder.agent.packet.label.navigation": "Navegación",
  "profileCms.builder.agent.packet.label.package": "Paquete",
  "profileCms.builder.agent.packet.label.packageHash": "Hash de paquete",
  "profileCms.builder.agent.packet.label.page": "Página",
  "profileCms.builder.agent.packet.label.payloadHash": "Hash de carga",
  "profileCms.builder.agent.packet.label.profile": "Perfil",
  "profileCms.builder.agent.packet.label.route": "Ruta",
  "profileCms.builder.agent.packet.label.site": "Sitio",
  "profileCms.builder.agent.packet.label.status": "Estado",
  "profileCms.builder.agent.packet.label.writable": "Escribible",
  "profileCms.builder.agent.packet.safety": "Reglas de origen",
  "profileCms.builder.agent.packet.validation": "Diagnósticos de validación",
  "profileCms.builder.agent.packet.value.no": "No",
  "profileCms.builder.agent.packet.value.yes": "Sí",
  "profileCms.builder.agent.patch.accepted":
    "El parche se valida contra el borrador actual.",
  "profileCms.builder.agent.patch.applied": "Parche aplicado a este borrador.",
  "profileCms.builder.agent.patch.apply": "Aplicar al borrador",
  "profileCms.builder.agent.patch.description":
    "Pegue o cargue un parche de agente, revise el diff y luego aplíquelo a este borrador.",
  "profileCms.builder.agent.patch.diff": "Diff propuesto",
  "profileCms.builder.agent.patch.fileTooLarge":
    "El archivo de parche es demasiado grande. Pegue un parche JSON más pequeño.",
  "profileCms.builder.agent.patch.label": "JSON de parche de agente",
  "profileCms.builder.agent.patch.rejected":
    "El parche fue rechazado antes de poder cambiar el borrador.",
  "profileCms.builder.agent.patch.review": "Revisar parche",
  "profileCms.builder.agent.patch.title": "Revisión de parche",
  "profileCms.builder.agent.patch.upload": "Cargar parche",
  "profileCms.builder.agent.source.description":
    "Exporte el contexto del borrador para herramientas locales y revise los límites del paquete.",
  "profileCms.builder.agent.source.title": "Paquete de origen",
  "profileCms.builder.api.disabled":
    "Las escrituras de la API del constructor no están habilitadas en este entorno frontend.",
  "profileCms.builder.api.draftSaved": "Borrador guardado.",
  "profileCms.builder.api.failed": "La acción de la API del constructor falló.",
  "profileCms.builder.api.missingDraftId":
    "Guarde un borrador antes de solicitar publicación.",
  "profileCms.builder.api.missingProfileId":
    "Esta ruta no pudo resolver un id de perfil para la API del constructor.",
  "profileCms.builder.api.profileNotAuthorized":
    "Conéctese a este perfil antes de usar acciones del constructor del servidor.",
  "profileCms.builder.api.publishRequiresSignedStorage":
    "La publicación requiere el flujo de almacenamiento descentralizado firmado y no está habilitada en este MVP.",
  "profileCms.builder.api.serverValidationCompleted":
    "Validación del servidor completada.",
  "profileCms.builder.block.body": "Cuerpo",
  "profileCms.builder.block.buttonLabel": "Etiqueta de botón",
  "profileCms.builder.block.buttonLink": "Enlace de botón",
  "profileCms.builder.block.buttonUrl": "URL de botón",
  "profileCms.builder.block.callout": "Llamada",
  "profileCms.builder.block.calloutTitle": "Título de llamada",
  "profileCms.builder.block.caption": "Leyenda",
  "profileCms.builder.block.citation": "Atribución",
  "profileCms.builder.block.heading": "Encabezado",
  "profileCms.builder.block.headingText": "Texto de encabezado",
  "profileCms.builder.block.image": "Imagen",
  "profileCms.builder.block.imageAlt": "Texto alternativo de imagen",
  "profileCms.builder.block.imageUri": "URI de imagen",
  "profileCms.builder.block.quote": "Cita",
  "profileCms.builder.block.quoteText": "Texto de cita",
  "profileCms.builder.block.remove": "Eliminar",
  "profileCms.builder.block.richText": "Texto enriquecido",
  "profileCms.builder.block.roomImageUri": "URI de obra de sala",
  "profileCms.builder.block.roomStyle": "Estilo de sala",
  "profileCms.builder.block.roomStyle.darkRoom": "Sala oscura",
  "profileCms.builder.block.roomStyle.salon": "Salón",
  "profileCms.builder.block.roomStyle.wall": "Muro simple",
  "profileCms.builder.block.roomStyle.whiteCube": "Cubo blanco",
  "profileCms.builder.block.roomTitle": "Título de obra de sala",
  "profileCms.builder.block.roomViewer": "Sala 3D",
  "profileCms.builder.block.tone": "Tono",
  "profileCms.builder.blocks.title": "Bloques",
  "profileCms.builder.cta.publish": "Publicar",
  "profileCms.builder.cta.saveDraft": "Guardar borrador",
  "profileCms.builder.cta.serverValidate": "Validar en servidor",
  "profileCms.builder.field.navigationLabel": "Etiqueta de navegación primaria",
  "profileCms.builder.field.pageDescription": "Descripción de página",
  "profileCms.builder.field.pageTitle": "Título de página",
  "profileCms.builder.field.siteDescription": "Descripción del sitio",
  "profileCms.builder.field.siteTitle": "Título del sitio",
  "profileCms.builder.field.socialImageAsset": "Id de imagen social",
  "profileCms.builder.field.themeAccent": "Acento de tema",
  "profileCms.builder.gallery.assets.empty": "No se encontraron obras.",
  "profileCms.builder.gallery.assets.feature": "Obra destacada",
  "profileCms.builder.gallery.assets.hide": "Ocultar",
  "profileCms.builder.gallery.assets.mediaPartial": "Medios pendientes",
  "profileCms.builder.gallery.assets.mediaReady": "Medios listos",
  "profileCms.builder.gallery.assets.moveDown": "Mover hacia abajo",
  "profileCms.builder.gallery.assets.moveUp": "Mover hacia arriba",
  "profileCms.builder.gallery.assets.owner": "Propietario: {owner}",
  "profileCms.builder.gallery.assets.title": "Obras",
  "profileCms.builder.gallery.assets.unfeature": "Dejar de destacar",
  "profileCms.builder.gallery.assets.unhide": "Mostrar",
  "profileCms.builder.gallery.collections.count": "{count} obras visibles",
  "profileCms.builder.gallery.collections.feature": "Colección destacada",
  "profileCms.builder.gallery.collections.title": "Colecciones destacadas",
  "profileCms.builder.gallery.collections.unfeature": "Dejar de destacar",
  "profileCms.builder.gallery.review.description":
    "Revise la instantánea de cartera congelada antes de guardar el paquete de galería generado.",
  "profileCms.builder.gallery.review.empty":
    "Solicite una instantánea de cartera para revisar activos, colecciones, estado de medios y vista previa generada.",
  "profileCms.builder.gallery.review.title": "Revisión de instantánea",
  "profileCms.builder.gallery.settings": "Configuración de la galería",
  "profileCms.builder.gallery.snapshot.api": "Instantánea del servidor",
  "profileCms.builder.gallery.snapshot.failed":
    "No se pudo crear la instantánea de la galería.",
  "profileCms.builder.gallery.snapshot.fixture": "Instantánea fija",
  "profileCms.builder.gallery.snapshot.loading": "Solicitando...",
  "profileCms.builder.gallery.snapshot.loadingDetail":
    "Recopilando tenencias y candidatos de medios para revisión.",
  "profileCms.builder.gallery.snapshot.request": "Solicitar instantánea",
  "profileCms.builder.gallery.snapshot.warning.fixtureBackendDisabled":
    "Instantánea fija utilizada hasta que se habilite el punto final de instantánea del servidor de galería.",
  "profileCms.builder.gallery.snapshot.warning.partialMedia":
    "Algunos medios pueden estar pendientes o no disponibles en la instantánea revisada.",
  "profileCms.builder.gallery.summary.hidden": "Obras ocultas",
  "profileCms.builder.gallery.summary.partial": "Medios parciales",
  "profileCms.builder.gallery.summary.visible": "Obras visibles",
  "profileCms.builder.gallery.summary.wallets": "Carteras",
  "profileCms.builder.gallery.wallets.emptyError":
    "Ingrese al menos una dirección ETH o nombre ENS.",
  "profileCms.builder.gallery.wallets.help":
    "Pegue una o más direcciones ETH o nombres ENS, separados por comas, espacios o saltos de línea.",
  "profileCms.builder.gallery.wallets.invalidError":
    "Estas entradas de cartera requieren atención: {entries}",
  "profileCms.builder.gallery.wallets.label": "Direcciones o nombres ENS",
  "profileCms.builder.gallery.wallets.title": "Fuentes de cartera",
  "profileCms.builder.json.downloadPackage": "Descargar JSON de paquete",
  "profileCms.builder.json.downloadSchemaBundle": "Descargar esquemas",
  "profileCms.builder.json.downloadSourcePacket": "Descargar paquete de origen",
  "profileCms.builder.json.import": "Importar JSON",
  "profileCms.builder.json.importFailed":
    "No se pudo importar el JSON del paquete.",
  "profileCms.builder.json.label": "Candidato de paquete",
  "profileCms.builder.json.title": "JSON de paquete",
  "profileCms.builder.pageDescription":
    "Construir y previsualizar un paquete de sitio CMS nativo del perfil.",
  "profileCms.builder.pageSettings": "Configuración de página de inicio",
  "profileCms.builder.pageTitle": "Constructor de CMS de perfil",
  "profileCms.builder.publishState.draftId": "Id de borrador",
  "profileCms.builder.publishState.noDraft": "Sin borrador guardado",
  "profileCms.builder.publishState.packageHash": "Hash de paquete",
  "profileCms.builder.publishState.payloadHash": "Hash de carga",
  "profileCms.builder.publishState.pending":
    "Guardar y publicar requieren los puntos finales del servidor. Esta interfaz de usuario no simulará una publicación de producción.",
  "profileCms.builder.publishState.title": "Estado de borrador y publicación",
  "profileCms.builder.siteSettings": "Configuración del sitio",
  "profileCms.builder.tab.agent": "Agente",
  "profileCms.builder.tab.editor": "Editor",
  "profileCms.builder.tab.json": "JSON",
  "profileCms.builder.tab.preview": "Vista previa",
  "profileCms.builder.templates.gallery": "Galería",
  "profileCms.builder.templates.homepage": "Página de inicio básica",
  "profileCms.builder.templates.room": "Sala 3D",
  "profileCms.builder.templates.status.comingSoon": "Próximamente",
  "profileCms.builder.templates.title": "Plantilla de sitio",
  "profileCms.builder.templates.walletGallery": "Galería de cartera",
  "profileCms.builder.validation.focusField": "Campo de enfoque",
  "profileCms.builder.validation.invalid":
    "El candidato de paquete necesita cambios.",
  "profileCms.builder.validation.issueDetail":
    "Revise este campo antes de guardar o publicar.",
  "profileCms.builder.validation.noIssues": "Sin problemas de validación.",
  "profileCms.builder.validation.severity.error": "Error",
  "profileCms.builder.validation.severity.warning": "Advertencia",
  "profileCms.builder.validation.title": "Validación",
  "profileCms.builder.validation.valid": "El candidato de paquete es válido.",
  "profileCms.builder.workspaceLabel":
    "Espacio de trabajo del constructor de CMS",
  "profileCms.error.description":
    "No se pudo renderizar este sitio web del perfil.",
  "profileCms.error.retry": "Reintentar",
  "profileCms.error.title": "Sitio web no disponible",
  "profileCms.header.openWebsite": "Abrir el sitio web {handle}",
  "profileCms.header.website": "Sitio web",
  "profileCms.interactive.budgetWarning":
    "Este activo 3D supera el presupuesto de rendimiento declarado, por lo que la carga puede ser lenta.",
  "profileCms.interactive.canvasLabel": "Vista previa interactiva 3D",
  "profileCms.interactive.deepZoom.description":
    "Este renderizador V1 mantiene el zoom profundo estático hasta que se habilite el visor interactivo.",
  "profileCms.interactive.deepZoom.title": "Vista previa de zoom profundo",
  "profileCms.interactive.embed.description":
    "Este contenido incrustado no está marcado para representación en espacio aislado.",
  "profileCms.interactive.embed.iframeTitle":
    "Medios del sitio web del perfil incrustado",
  "profileCms.interactive.embed.title": "Vista previa de medios incrustados",
  "profileCms.interactive.enterRoom": "Entrar en la sala",
  "profileCms.interactive.exitFullscreen": "Salir de pantalla completa",
  "profileCms.interactive.fullscreen": "Pantalla completa",
  "profileCms.interactive.loadError":
    "No se pudo cargar la vista previa 3D. Utilice los enlaces 2D a continuación.",
  "profileCms.interactive.loadObject": "Cargar objeto 3D",
  "profileCms.interactive.loading": "Cargando {progress}%",
  "profileCms.interactive.mobileFallback":
    "Esta vista móvil utiliza el póster estático y enlaces 2D para una experiencia más ligera y confiable.",
  "profileCms.interactive.object.description":
    "Cargue el visor GLB o glTF cuando esté listo para inspeccionar el modelo.",
  "profileCms.interactive.object.title": "Vista previa de objeto 3D",
  "profileCms.interactive.openFallback": "Abrir alternativa 2D",
  "profileCms.interactive.openSourceMedia": "Abrir medios de origen",
  "profileCms.interactive.room.description":
    "Ingrese a una sala de exhibición simple. Todas las obras de arte siguen vinculadas a su página de detalle 2D canónica.",
  "profileCms.interactive.room.title": "Vista previa de la sala",
  "profileCms.interactive.roomWorksLabel": "Obras de la sala",
  "profileCms.media.captionTrackLabel": "Descripción",
  "profileCms.media.noCaptions":
    "No se proporcionaron subtítulos para este activo multimedia.",
  "profileCms.nav.label": "Navegación {siteTitle}",
  "profileCms.reference.chain": "Cadena {chainId}",
  "profileCms.reference.tokenTitle": "Token #{tokenId}",
  "profileCms.state.empty.description":
    "Este sitio web del perfil se ha publicado, pero esta página no está disponible.",
  "profileCms.state.empty.title": "Página del sitio web no encontrada",
  "profileCms.state.eyebrow": "Sitio web del perfil",
  "profileCms.state.loading.title": "Cargando el sitio web",
  "profileCms.state.routeUnavailable.title": "Ruta del sitio web no disponible",
  "profileCms.walletGallery.blockNumber": "Bloque",
  "profileCms.walletGallery.capturedAt": "Capturado",
  "profileCms.walletGallery.summary.many": "{count} carteras",
  "profileCms.walletGallery.summary.one": "{count} cartera",
  "profileCms.walletGallery.title": "Galería de cartera",
  "drop.media.alt": "Medio del drop",
  "drop.media.processing": "Procesando imagen",
  "drop.media.loading": "Cargando imagen",
  "drop.media.unavailable": "Imagen no disponible",
  "drop.media.loadFailed": "No se pudo cargar la imagen.",
  "drop.media.retry": "Reintentar",
  "drop.media.openPreview": "Abrir vista previa de imagen",
  "drop.media.openMedia": "Abrir medio del drop",
  "drop.media.saveDialogTitle": "Guardar imagen",
  "drop.media.processingFailed": "El procesamiento de la imagen fallo.",
  "drop.media.processingTimedOut": "El procesamiento de la imagen expiro.",
  "quickDm.regionAriaLabel": "Mensajes directos rápidos",
  "quickDm.openButtonAriaLabel": "Abrir mensajes directos rápidos",
  "quickDm.openButtonUnreadAriaLabel":
    "Abrir mensajes directos rápidos, {count} mensajes sin leer",
  "quickDm.openButtonTitle": "Mensajes directos",
  "quickDm.listTitle": "Mensajes",
  "quickDm.chatTitleFallback": "Mensajes",
  "quickDm.closeAriaLabel": "Cerrar mensajes directos rápidos",
  "quickDm.backAriaLabel": "Volver a la lista de mensajes directos",
  "quickDm.openAll": "Abrir todos los mensajes",
  "quickDm.openAllAriaLabel": "Abrir todos los mensajes directos",
  "quickDm.showAll": "Ver todos",
  "quickDm.openConversation": "Abrir conversación",
  "quickDm.openConversationAriaLabel": "Abrir conversación con {name}",
  "quickDm.unreadCountAriaLabel": "{count} mensajes sin leer",
  "quickDm.unreadPreview": "Mensajes nuevos",
  "quickDm.noMessagesYet": "Aún no hay mensajes",
  "quickDm.emptyTitle": "Aún no hay mensajes directos",
  "quickDm.loadingStatus": "Cargando mensajes directos",
  "quickDm.chatLoadError": "No se pudo cargar esta conversación.",
  ...ES_ES_QR_SCANNER_MESSAGES,
  ...ES_ES_CAPACITOR_CONNECT_MESSAGES,
  ...ES_ES_NEW_VERSION_TOAST_MESSAGES,
  "waves.chat.fileUploadAreaAriaLabel":
    "Área de carga de archivos del chat de wave",
  "waves.chat.guidelinesDialog.title": "Directrices de la wave",
  "waves.chat.guidelinesDialog.description":
    "Revisa las directrices de esta wave antes de enviar tu primer mensaje.",
  "waves.chat.guidelinesDialog.guidelinesLabel": "Directrices",
  "waves.chat.guidelinesDialog.actionHint":
    "Aceptar envía tu mensaje. Rechazar lo conserva como borrador.",
  "waves.chat.guidelinesDialog.agree": "Aceptar",
  "waves.chat.guidelinesDialog.decline": "Rechazar",
  "waves.chat.guidelinesDialog.loadErrorTitle":
    "No se pudieron cargar las directrices de la wave.",
  "waves.chat.guidelinesDialog.loadErrorDescription":
    "Inténtalo de nuevo antes de enviar tu mensaje.",
  ...stormComposerEsMessages,
  "waves.loadingStatus": "Cargando waves",
  "waves.gifPicker.open": "Añadir GIF",
  "waves.gifPicker.dialogTitle": "Busqueda de GIF",
  "waves.gifPicker.searchPlaceholder": "Buscar GIF",
  "waves.gifPicker.noResults": "No se encontraron GIFs.",
  "waves.gifPicker.poweredBy": "Con tecnología de {brandName}",
  "waves.gifPicker.poweredByPrefix": "Con tecnología de",
  "waves.gifPicker.status.checking": "Buscando GIF...",
  "waves.gifPicker.status.ready": "La busqueda de GIF esta lista.",
  "waves.gifPicker.unavailable.title":
    "La busqueda de GIF no esta disponible temporalmente.",
  "waves.gifPicker.unavailable.hint":
    "Puedes subir un archivo GIF en su lugar.",
  "common.close": "Cerrar",
  "waves.create.dialog.subwaveTitle": "Crear subwave",
  "waves.create.dialog.waveTitle": "Crear wave",
  "waves.create.actions.cancel": "Cancelar",
  "waves.create.actions.backToCriteria": "Volver a los criterios",
  "waves.create.actions.complete": "Completar",
  "waves.create.actions.next": "Siguiente",
  "waves.create.actions.previous": "Anterior",
  "waves.create.actions.save": "Guardar",
  "waves.create.advanced.title": "Configuración avanzada",
  "waves.create.advanced.customized": "Personalizada",
  "waves.create.advanced.needsAttention": "Requiere atención",
  "waves.create.advanced.errorSummary":
    "Revisa los ajustes señalados antes de continuar.",
  "waves.create.overview.title": "Crear Wave",
  "waves.create.overview.picture": "Imagen de la Wave",
  "waves.create.overview.advancedTitle": "Apariencia y etiquetas",
  "waves.create.overview.displaySettings": "Ajustes de visualización",
  "waves.create.groups.title": "Acceso",
  "waves.create.groups.description":
    "Elige quién puede acceder, participar y gestionar esta Wave.",
  "waves.create.groups.viewGroupName": "Visibilidad",
  "waves.create.groups.adminGroupName": "Administradores",
  "waves.create.groups.currentGroupWithName": "Grupo actual: {name}",
  "waves.create.groups.dialog.addTitle": "Añadir grupo",
  "waves.create.groups.dialog.changeTitle": "Cambiar grupo",
  "waves.create.groups.dialog.addDescription":
    "Crea un grupo nuevo o elige uno existente.",
  "waves.create.groups.dialog.changeDescription":
    "Crea un grupo nuevo o elige otro grupo existente.",
  "waves.create.groups.identities": "Identidades",
  "waves.create.groups.hideCriteriaAndMembers": "Ocultar criterios y miembros",
  "waves.create.groups.hideCriteriaAndMembersTooltip":
    "Los criterios y la lista de miembros son visibles para los miembros de este grupo, pero están ocultos para los demás.",
  "waves.create.groups.hideCriteriaAndMembersInfoLabel":
    "Acerca de la visibilidad de los criterios y miembros",
  "waves.create.groups.editAccess.title": "Editar acceso de {groupLabel}",
  "waves.create.groups.editAccess.triggerLabel":
    "Editar acceso de {groupLabel}",
  "waves.create.groups.editAccess.chatLabel": "Chat",
  "waves.create.groups.editAccess.description":
    "Los criterios actuales aparecen precargados. Al guardar se crea un grupo nuevo y solo cambia el acceso de {groupLabel}.",
  "waves.create.groups.editAccess.loading": "Cargando los criterios actuales…",
  "waves.create.groups.editAccess.loadErrorTitle":
    "No se pudieron cargar los criterios actuales.",
  "waves.create.groups.editAccess.loadErrorDescription":
    "No se ha cambiado nada. Intenta cargar el grupo de nuevo.",
  "waves.create.groups.editAccess.retry": "Volver a intentar",
  "waves.create.groups.editAccess.makePublic": "Hacer pública la wave",
  "waves.create.groups.editAccess.makePublicDescription":
    "Elimina la restricción de visibilidad para que todo el mundo pueda acceder a esta wave.",
  "waves.create.groups.editAccess.useVisibility":
    "Usar criterios de visibilidad",
  "waves.create.groups.editAccess.useVisibilityDescription":
    "Aplica al acceso de {groupLabel} los mismos criterios que a Visibilidad.",
  "waves.create.groups.editAccess.useVisibilityPublicDescription":
    "La visibilidad es pública. Haz público también el acceso de {groupLabel}.",
  "waves.create.groups.editAccess.makePublicConfirmTitle":
    "¿Hacer pública la wave?",
  "waves.create.groups.editAccess.makePublicConfirmMessage":
    "Todo el mundo podrá encontrar y ver esta wave. Solo cambiará el acceso de Visibilidad.",
  "waves.create.groups.editAccess.useVisibilityConfirmTitle":
    "¿Usar los criterios de visibilidad?",
  "waves.create.groups.editAccess.useVisibilityConfirmMessage":
    "El acceso de {groupLabel} usará el mismo grupo que Visibilidad. Solo cambiará este ajuste de acceso.",
  "waves.create.groups.editAccess.useVisibilityPublicConfirmMessage":
    "La visibilidad es pública, así que el acceso de {groupLabel} también será público. Solo cambiará este ajuste de acceso.",
  "waves.create.groups.editAccess.confirmMakePublic": "Hacer pública",
  "waves.create.groups.editAccess.confirmUseVisibility":
    "Usar criterios de visibilidad",
  "waves.create.groups.actions.editCriteria": "Editar criterios",
  "waves.create.groups.inlineIdentities.modeLabel":
    "Tratamiento de identidades",
  "waves.create.groups.inlineIdentities.included.label": "Incluidas",
  "waves.create.groups.inlineIdentities.included.searchLabel":
    "Buscar una identidad para incluir",
  "waves.create.groups.inlineIdentities.included.searchPlaceholder":
    "Buscar identidades para incluir...",
  "waves.create.groups.inlineIdentities.included.emptyHelper":
    "No hay identidades incluidas explícitamente.",
  "waves.create.groups.inlineIdentities.excluded.label": "Excluidas",
  "waves.create.groups.inlineIdentities.excluded.searchLabel":
    "Buscar una identidad para excluir",
  "waves.create.groups.inlineIdentities.excluded.searchPlaceholder":
    "Buscar identidades para excluir...",
  "waves.create.groups.inlineIdentities.excluded.emptyHelper":
    "No hay identidades excluidas explícitamente.",
  "waves.create.groups.inlineIdentities.includeMe": "Incluirme",
  "waves.create.groups.inlineIdentities.sources.emma.title": "EMMA",
  "waves.create.groups.inlineIdentities.sources.emma.description":
    "Añade todas las carteras de una de tus listas EMMA.",
  "waves.create.groups.inlineIdentities.sources.emma.searchLabel":
    "Buscar listas",
  "waves.create.groups.inlineIdentities.sources.emma.searchLoading":
    "Cargando listas...",
  "waves.create.groups.inlineIdentities.sources.emma.searchEmpty":
    "No se encontraron listas",
  "waves.create.groups.inlineIdentities.sources.emma.empty":
    "No se ha añadido ninguna lista.",
  "waves.create.groups.inlineIdentities.sources.emma.loading":
    "Añadiendo identidades de la lista...",
  "waves.create.groups.inlineIdentities.sources.emma.load": "Cargar lista",
  "waves.create.groups.inlineIdentities.sources.emma.error":
    "No se pudo cargar esta lista. Inténtalo de nuevo.",
  "waves.create.groups.inlineIdentities.sources.emma.authenticationRequired":
    "Conecta tu billetera para cargar esta lista.",
  "waves.create.groups.inlineIdentities.sources.emma.remove":
    "Eliminar la lista EMMA",
  "waves.create.groups.inlineIdentities.sources.csv.title": "Archivo CSV",
  "waves.create.groups.inlineIdentities.sources.csv.description":
    "Importa carteras de Ethereum desde un archivo CSV.",
  "waves.create.groups.inlineIdentities.sources.csv.dropLabel":
    "Suelta un archivo CSV aquí o elige un archivo",
  "waves.create.groups.inlineIdentities.sources.csv.includeInputLabel":
    "Elegir un archivo CSV de identidades para incluir",
  "waves.create.groups.inlineIdentities.sources.csv.excludeInputLabel":
    "Elegir un archivo CSV de identidades para excluir",
  "waves.create.groups.inlineIdentities.sources.csv.invalidFile":
    "Elige un archivo CSV.",
  "waves.create.groups.inlineIdentities.sources.csv.readError":
    "No se pudo leer el archivo. Prueba con otro archivo CSV.",
  "waves.create.groups.inlineIdentities.sources.csv.noWallets":
    "No se encontraron direcciones de cartera de Ethereum válidas.",
  "waves.create.groups.inlineIdentities.sources.csv.empty":
    "No se ha añadido ningún archivo CSV.",
  "waves.create.groups.inlineIdentities.sources.csv.remove":
    "Eliminar archivo CSV",
  "waves.create.groups.inlineIdentities.sources.count.one":
    "{count} identidad añadida",
  "waves.create.groups.inlineIdentities.sources.count.other":
    "{count} identidades añadidas",
  "waves.create.groups.inlineIdentities.sources.total.included.one":
    "{count} identidad única incluida",
  "waves.create.groups.inlineIdentities.sources.total.included.other":
    "{count} identidades únicas incluidas",
  "waves.create.groups.inlineIdentities.sources.total.excluded.one":
    "{count} identidad única excluida",
  "waves.create.groups.inlineIdentities.sources.total.excluded.other":
    "{count} identidades únicas excluidas",
  "waves.create.groups.inlineIdentities.sources.includeLimit":
    "Un grupo puede incluir como máximo {limit} identidades.",
  "waves.create.groups.inlineIdentities.sources.excludeLimit":
    "Un grupo puede excluir como máximo {limit} identidades.",
  "waves.create.groups.inlineIdentities.sources.retry": "Intentar de nuevo",
  "waves.create.groups.members.currentCount.one": "{count} usuario",
  "waves.create.groups.members.currentCount.other": "{count} usuarios",
  "waves.create.groups.members.countLoading":
    "Comprobando la audiencia actual…",
  "waves.create.groups.members.countUnavailable":
    "Audiencia actual no disponible",
  "waves.create.groups.members.view": "Ver miembros",
  "waves.create.groups.members.previewDraft": "Previsualizar coincidencias",
  "waves.create.groups.members.dialogTitle": "{role}: {group}",
  "waves.create.groups.members.dynamicDescription":
    "Esta vista previa en directo se basa en los datos actuales de perfil, reputación y propiedad. La pertenencia puede cambiar.",
  "waves.create.groups.members.criteriaSummary":
    "Por qué cumplen los requisitos estas identidades",
  "waves.create.groups.members.criteriaUnavailable":
    "Los criterios del grupo no están disponibles, pero aún puedes consultar los miembros actuales abajo.",
  "waves.create.groups.members.searchLabel": "Buscar una identidad",
  "waves.create.groups.members.searchPlaceholder":
    "Buscar por nombre o cartera",
  "waves.create.groups.members.clearSearch": "Borrar la búsqueda de identidad",
  "waves.create.groups.members.loadingStatus": "Cargando miembros actuales",
  "waves.create.groups.members.empty":
    "Ninguna identidad coincide actualmente con este grupo.",
  "waves.create.groups.members.searchEmpty":
    "No se encontraron identidades coincidentes.",
  "waves.create.groups.members.errorTitle":
    "No se pudieron cargar los miembros actuales.",
  "waves.create.groups.members.errorDescription":
    "Comprueba tu conexión e inténtalo de nuevo.",
  "waves.create.groups.members.retry": "Intentar de nuevo",
  "waves.create.groups.members.listLabel": "Miembros actuales del grupo",
  "waves.create.groups.members.openProfile":
    "Abrir el perfil de {identity} en una pestaña nueva",
  "waves.create.groups.members.criteria.metric.tdh": "TDH",
  "waves.create.groups.members.criteria.metric.xtdh": "xTDH",
  "waves.create.groups.members.criteria.metric.tdhAndXtdh": "TDH + xTDH",
  "waves.create.groups.members.criteria.metric.rep": "REP",
  "waves.create.groups.members.criteria.metric.nic": "NIC",
  "waves.create.groups.members.criteria.metric.level": "Nivel",
  "waves.create.groups.members.criteria.range.atMost":
    "{metric} como máximo {max}",
  "waves.create.groups.members.criteria.range.atLeast":
    "{metric} al menos {min}",
  "waves.create.groups.members.criteria.range.between":
    "{metric} entre {min} y {max}",
  "waves.create.groups.members.criteria.identityRange.atMost":
    "{metric} {direction} {identity} como máximo {max}",
  "waves.create.groups.members.criteria.identityRange.atLeast":
    "{metric} {direction} {identity} al menos {min}",
  "waves.create.groups.members.criteria.identityRange.between":
    "{metric} {direction} {identity} entre {min} y {max}",
  "waves.create.groups.members.criteria.identity":
    "{metric} {direction} {identity}",
  "waves.create.groups.members.criteria.categoryRange.atMost":
    "{metric} en {category} como máximo {max}",
  "waves.create.groups.members.criteria.categoryRange.atLeast":
    "{metric} en {category} al menos {min}",
  "waves.create.groups.members.criteria.categoryRange.between":
    "{metric} en {category} entre {min} y {max}",
  "waves.create.groups.members.criteria.category": "{metric} en {category}",
  "waves.create.groups.members.criteria.categoryIdentityRange.atMost":
    "{metric} en {category} {direction} {identity} como máximo {max}",
  "waves.create.groups.members.criteria.categoryIdentityRange.atLeast":
    "{metric} en {category} {direction} {identity} al menos {min}",
  "waves.create.groups.members.criteria.categoryIdentityRange.between":
    "{metric} en {category} {direction} {identity} entre {min} y {max}",
  "waves.create.groups.members.criteria.categoryIdentity":
    "{metric} en {category} {direction} {identity}",
  "waves.create.groups.members.criteria.from": "de",
  "waves.create.groups.members.criteria.to": "a",
  "waves.create.groups.members.criteria.included.one":
    "{count} usuario incluido explícitamente",
  "waves.create.groups.members.criteria.included.other":
    "{count} usuarios incluidos explícitamente",
  "waves.create.groups.members.criteria.excluded.one":
    "{count} usuario excluido explícitamente",
  "waves.create.groups.members.criteria.excluded.other":
    "{count} usuarios excluidos explícitamente",
  "waves.create.groups.members.criteria.grant": "Subvención xTDH {grantId}",
  "waves.create.groups.members.criteria.grant.collection":
    "Subvención xTDH para {collectionName}",
  "waves.create.groups.members.criteria.grant.selected":
    "Subvención xTDH seleccionada",
  "waves.create.groups.xtdhGrant.change": "Cambiar subvención",
  "waves.create.groups.xtdhGrant.cancelChange": "Cancelar cambio",
  "waves.create.groups.xtdhGrant.remove": "Eliminar subvención",
  "waves.create.groups.validation.checking": "Comprobando el acceso…",
  "waves.create.groups.validation.unavailableTitle":
    "No se pudo verificar el acceso.",
  "waves.create.groups.validation.unavailable":
    "No se pudo verificar el acceso de los grupos. Inténtalo de nuevo antes de continuar.",
  "waves.create.groups.validation.outsideView":
    "El grupo «{groupName}» incluye personas que no están en «{viewGroupName}».",
  "waves.create.groups.validation.invalidTitle":
    "Algunos grupos de acceso necesitan atención.",
  "waves.create.groups.validation.invalidDescription":
    "Cada miembro de los grupos de envíos, votación, chat y administración también debe pertenecer al grupo de visualización.",
  "waves.create.dates.title": "Calendario",
  "waves.create.dates.description":
    "Revisa cuándo empieza la Wave, comienza la votación y se anuncian los ganadores.",
  "waves.create.dates.approve.noEndSummary":
    "Empieza el {start}. Sin fecha de finalización.",
  "waves.create.dates.approve.endSummary":
    "Empieza el {start}. Termina el {end}.",
  "waves.create.dates.approve.endInfoLabel": "Acerca del final de la Wave",
  "waves.create.dates.approve.advancedSummary": "Final de la Wave",
  "waves.create.dates.rank.ongoingSummary":
    "Los envíos empiezan el {submission}. La votación empieza el {voting}. La clasificación permanece abierta.",
  "waves.create.dates.rank.scheduledSummary":
    "Los envíos empiezan el {submission}. La votación empieza el {voting}. Primeros ganadores: {announcement}.",
  "waves.create.dates.rank.advancedSummary": "Calendario de ganadores",
  "waves.create.drops.requirementsTitle": "Requisitos de envío",
  "waves.create.rules.advancedSummary": "Directrices de la Wave y aceptación",
  "waves.create.rules.chatAdvancedSummary": "Directrices de la Wave",
  "waves.create.rules.guidelinesSettingsLabel": "Directrices",
  "waves.create.rules.guidelinesSettingsEditLabel": "Editar directrices",
  "waves.create.rules.guidelinesSettingsAdded": "Añadidas",
  "waves.create.rules.guidelinesSettingsNone": "Ninguna",
  "waves.create.rules.guidelinesAuthError":
    "No se pudo autenticar. Vuelve a conectar tu cartera e inténtalo de nuevo.",
  "waves.create.rules.guidelinesSaveError":
    "No se pudieron guardar estas directrices. Inténtalo de nuevo.",
  "waves.create.rules.guidelinesSaveErrorTitle":
    "No se pudieron guardar estas directrices.",
  "waves.create.rules.guidelinesSaveErrorDescription": "Inténtalo de nuevo.",
  "waves.create.voting.rankAdvancedSummary":
    "Límites y comportamiento del voto",
  "waves.create.voting.approveAdvancedSummary":
    "Límites, comportamiento y tiempos del voto",
  "waves.create.outcomes.rankAdvancedSummary": "Visibilidad de los resultados",
  "waves.create.outcomes.approveAdvancedSummary": "Límites de ganadores",
  "waves.create.drops.maxSimultaneousSubmissions.label":
    "Máximo de envíos simultáneos",
  "waves.create.drops.maxSimultaneousSubmissions.description":
    "Número máximo de envíos simultáneos por participante. Opcional. Sin límite si se deja en blanco.",
  "waves.proposalCard.contextLabel": "Propuesta",
  "waves.proposalCard.readFull": "Leer completa",
  "waves.proposalCard.readFullNamed": "Leer completa: {title}",
  "waves.proposalCard.untitledProposal": "Propuesta sin título",
  "waves.proposalCard.previewAlt": "Vista previa multimedia de {title}",
  "waves.proposalCard.part.one": "{count} parte",
  "waves.proposalCard.part.other": "{count} partes",
  "waves.proposalCard.media.one": "{count} elemento multimedia",
  "waves.proposalCard.media.other": "{count} elementos multimedia",
  "waves.proposalCard.attachment.one": "{count} archivo adjunto",
  "waves.proposalCard.attachment.other": "{count} archivos adjuntos",
  "waves.proposalCard.appearanceLabel": "Aspecto de la tarjeta de propuesta",
  "waves.proposalCard.mode.standard.label": "Propuesta completa",
  "waves.proposalCard.mode.standard.description":
    "Muestra el contenido original directamente en el feed.",
  "waves.proposalCard.mode.custom.label": "Tarjeta resumen",
  "waves.proposalCard.mode.custom.description":
    "Muestra un título, texto abreviado y una imagen opcional.",
  "waves.proposalCard.excerptLabel": "Límite de la vista previa del texto",
  "waves.proposalCard.excerptInputAriaLabel":
    "Máximo de caracteres en la vista previa de la propuesta",
  "waves.proposalCard.characters": "caracteres",
  "waves.proposalCard.excerptRangeError":
    "Introduce un número entero entre {min} y {max}.",
  "waves.proposalCard.mediaLabel": "Imagen en la tarjeta resumen",
  "waves.proposalCard.settings.editLabel":
    "Editar los ajustes de las tarjetas de propuesta",
  "waves.proposalCard.settings.layoutLabel": "Diseño de la propuesta",
  "waves.proposalCard.settings.rowLabel": "Tarjetas de propuesta",
  "waves.proposalCard.settings.toastAuthFailed":
    "No se pudo autenticar. Vuelve a conectar tu cartera e inténtalo de nuevo.",
  "waves.proposalCard.settings.toastSaveFailedTitle":
    "No se pudieron guardar estos ajustes de las tarjetas de propuesta.",
  "waves.proposalCard.settings.toastRetry": "Inténtalo de nuevo.",
  "waves.proposalCard.tabLabelsLabel": "Etiquetas de pestañas",
  "waves.proposalCard.tabLabelsDescription":
    "Nombres que se muestran en las pestañas de esta Wave.",
  "waves.proposalCard.approvalsTabLabel":
    "Etiqueta de la pestaña de propuestas",
  "waves.proposalCard.approvedTabLabel": "Etiqueta de la pestaña de aprobadas",
  "waves.proposalCard.tabLabels.errorTooLong":
    "Las etiquetas deben tener {max} caracteres o menos.",
  "waves.proposalCard.tabLabels.errorDuplicate":
    "Usa dos etiquetas de pestaña diferentes.",
  "waves.proposalCard.tabLabels.errorReserved":
    "Las etiquetas no pueden coincidir con pestañas existentes.",
  ...ES_ES_PAGINATION_MESSAGES,
  "memes.quickVote.leftThisRound": "{count} restantes esta ronda",
  "memes.quickVote.unrated": "{count} sin valorar",
  "memes.quickVote.summary": "{leftThisRound}, {unrated}",
  "memes.quickVote.inMemesWave": "{leftThisRound}, {unrated} en la wave memes",
  "memes.waveFooter.quickVote.label": "Voto rápido",
  "memes.waveFooter.quickVote.open": "Abrir voto rápido",
  "memes.waveFooter.uncastPower.ariaLabel":
    "Poder sin usar, quedan {power} {votingLabel}, {leftThisRound}, {unrated}",
  "memes.waveFooter.uncastPower.title": "Poder sin usar",
  "memes.waveFooter.uncastPower.visibleValue": "{power} {votingLabel}",
  "memes.waveFooter.uncastPower.votes": "Votos",
  "memes.waveFooter.uncastPower.votesVisible": "votos",
  ...ES_ES_DROP_REACTION_MESSAGES,
  "waves.mobile.profileFeed.title": "Feed de Profile Waves",
  "waves.mobile.profileFeed.subtitle": "Drops destacados de profile waves",
  "waves.leaderboard.listLabel": "Drops de la clasificación",
  "waves.leaderboard.loadingEarlier": "Cargando drops anteriores",
  "waves.leaderboard.previousLoadError":
    "No se pudieron cargar los drops anteriores. Selecciona Reintentar para volver a intentarlo.",
  "waves.leaderboard.retryEarlier": "Reintentar la carga de drops anteriores",
  "waves.leaderboard.loadingMore": "Cargando más drops",
  "waves.leaderboard.nextLoadError":
    "No se pudieron cargar más drops. Selecciona Reintentar para volver a intentarlo.",
  "waves.leaderboard.retryMore": "Reintentar la carga de más drops",
  "waves.leaderboard.loadMore": "Cargar más drops",
  "waves.leaderboard.loadingMoreButton": "Cargando…",
  "waves.leaderboard.grid.untitled": "Drop sin título",
  "waves.leaderboard.grid.readFull": "Leer todo",
  "waves.leaderboard.grid.open": "Abrir",
  "waves.leaderboard.grid.openNamed": "Abrir {title}",
  "waves.leaderboard.grid.authorProfile": "Ver el perfil de {author}",
  "waves.leaderboard.grid.voters.one": "{count} votante",
  "waves.leaderboard.grid.voters.other": "{count} votantes",
  "waves.leaderboard.grid.you": "Tú",
  "waves.leaderboard.grid.votesNow": "Votos actuales",
  "waves.leaderboard.grid.status.approved": "Aprobado",
  "waves.leaderboard.grid.status.approvingIn": "Aprobación en {time}",
  "waves.leaderboard.grid.status.reachedThreshold": "Umbral alcanzado",
  "waves.leaderboard.grid.status.closed": "Cerrado",
  "waves.leaderboard.grid.status.needs": "Faltan {amount}",
  "waves.leaderboard.grid.voteSummary.approval":
    "Alcanzados {reached} de {required} {unit}. Estado: {status}.",
  "waves.leaderboard.grid.voteSummary.approvalWithRealtime":
    "Alcanzados {reached} de {required} {unit}. Votos actuales: {votesNow} {unit}. Estado: {status}.",
  "waves.leaderboard.grid.voteSummary.standard":
    "Voto actual: {current} {unit}. Proyección: {projected} {unit}.",
  "waves.leaderboard.timeline.toggle":
    "Mostrar u ocultar la cronología de decisiones",
  "waves.leaderboard.timeline.decisionTimeline": "Cronología de decisiones",
  "waves.leaderboard.timeline.announcementHistory": "Historial de anuncios",
  "waves.leaderboard.timeline.paused": "En pausa",
  "waves.leaderboard.timeline.nextDecisionAfter":
    "Próxima decisión después del {date}",
  "waves.leaderboard.timeline.noDecisionScheduled":
    "No hay ninguna decisión programada",
  "waves.leaderboard.timeline.noUpcomingEvents": "No hay próximos eventos",
  "waves.leaderboard.timeline.nextWinner": "Próximo ganador",
  "waves.leaderboard.timeline.nextWinnerIn": "Próximo ganador en {countdown}",
  "waves.leaderboard.timeline.unit.day.one": "{count} día",
  "waves.leaderboard.timeline.unit.day.other": "{count} días",
  "waves.leaderboard.timeline.unit.hour.one": "{count} hora",
  "waves.leaderboard.timeline.unit.hour.other": "{count} horas",
  "waves.leaderboard.timeline.unit.minute.one": "{count} minuto",
  "waves.leaderboard.timeline.unit.minute.other": "{count} minutos",
  "waves.leaderboard.timeline.unit.second.one": "{count} segundo",
  "waves.leaderboard.timeline.unit.second.other": "{count} segundos",
  "waves.leaderboard.timeline.status.next": "Siguiente",
  "waves.leaderboard.timeline.status.done": "Hecho",
  "waves.leaderboard.timeline.status.completed": "Completado",
  "waves.poll.actions.viewResults": "Ver resultados",
  "waves.poll.actions.vote": "Votar",
  "waves.poll.actions.changeVote": "Cambiar voto",
  "waves.poll.status.voted": "Votado",
  "waves.poll.status.updated": "Actualizado",
  "waves.composer.placeholder.createDrop": "Crear un drop",
  "waves.composer.placeholder.writeChatMessage": "Escribe un mensaje de chat",
  "waves.composer.placeholder.dropReply": "Responder con un drop",
  "waves.composer.placeholder.postReply": "Publicar una respuesta",
  "waves.composer.placeholder.quoteDrop": "Citar un drop",
  "waves.composer.placeholder.postQuote": "Publicar una cita",
  "waves.poll.composer.title": "Crear encuesta",
  "waves.poll.composer.questionPlaceholder":
    "Haz una pregunta para la encuesta",
  "waves.poll.composer.questionRequired":
    "Añade una pregunta para la encuesta.",
  "waves.poll.composer.mode.groupLabel": "Tipo de respuesta de la encuesta",
  "waves.poll.composer.mode.single": "Única",
  "waves.poll.composer.mode.multiple": "Múltiple",
  "waves.poll.composer.mode.singleDescription":
    "Los votantes pueden seleccionar una opción.",
  "waves.poll.composer.mode.multipleDescription":
    "Los votantes pueden seleccionar más de una opción.",
  "waves.poll.composer.optionLabel": "Opción de encuesta {number}",
  "waves.poll.composer.optionPlaceholder": "Opción {number}",
  "waves.poll.composer.removeOption": "Eliminar la opción {number}",
  "waves.poll.composer.add": "Añadir encuesta",
  "waves.poll.composer.addOption": "Añadir opción",
  "waves.poll.composer.remove": "Eliminar encuesta",
  "waves.poll.composer.closingTime": "Hora de cierre",
  "waves.poll.composer.onlyDroppersCanRespond":
    "Solo pueden responder quienes pueden participar en el chat",
  "waves.poll.composer.anonymous": "Encuesta anónima",
  "waves.poll.composer.validation.minimumOptions":
    "Introduce al menos {count} opciones.",
  "waves.poll.composer.validation.optionLength":
    "Las opciones pueden tener hasta {max} caracteres.",
  "waves.poll.composer.validation.uniqueOptions":
    "Las opciones de la encuesta deben ser únicas.",
  "waves.poll.composer.validation.futureClosingTime":
    "Elige una hora de cierre futura.",
  "theMemes.documentTitle": "The Memes | Colecciones",
  "theMemes.description.collections": "Colecciones",
  "theMemes.detail.live.artwork.mintDateLabel": "Fecha de mint:",
  ...ES_ES_THE_MEMES_COLLECTORS_MESSAGES,
  "theMemes.sorting.regionLabel": "Orden de memes",
  "theMemes.sorting.sortBy": "Ordenar por",
  "theMemes.sorting.directionLegend": "Dirección de ordenación",
  "theMemes.sorting.ascendingLabel": "Orden ascendente",
  "theMemes.sorting.descendingLabel": "Orden descendente",
  "theMemes.sorting.sortButtonLabel": "Ordenar por {sort}",
  "theMemes.filters.triggerAriaLabel": "{filter}: {value}",
  "theMemes.filters.year.label": "Año",
  "theMemes.filters.year.all": "Todos los años",
  "theMemes.filters.year.option": "Año {year}",
  "theMemes.filters.season.label": "Temporada",
  "theMemes.filters.season.all": "Todas las temporadas",
  "theMemes.filters.season.allForYear": "Todo el año {year}",
  "theMemes.loading.fetching": "Cargando",
  "theMemes.empty.title": "No se encontraron memes",
  "theMemes.empty.description":
    "Prueba otra temporada u otra opción de ordenación.",
  "theMemes.card.linkAriaLabel": "Ver {name}, tarjeta #{tokenId}",
  "theMemes.card.metric.editionSize": "Tamaño de edición: {value}",
  "theMemes.card.metric.collectors": "Coleccionistas: {value}",
  "theMemes.card.metric.unique": "Único: {value}",
  "theMemes.card.metric.uniqueExMuseum": "Único sin museo: {value}",
  "theMemes.card.metric.floorPrice": "Precio mínimo: {value}",
  "theMemes.card.metric.floorPriceUnavailable": "Precio mínimo: N/D",
  "theMemes.card.metric.highestOffer": "Oferta más alta: {value}",
  "theMemes.card.metric.highestOfferUnavailable": "Oferta más alta: N/D",
  "theMemes.card.metric.marketCap": "Capitalización: {value}",
  "theMemes.card.metric.marketCapUnavailable": "Capitalización: N/D",
  "theMemes.card.metric.volume": "Volumen ({volumeType}): {value}",
  "theMemes.sort.age": "Edad",
  "theMemes.sort.editionSize": "Tamaño de edición",
  "theMemes.sort.collectors": "Coleccionistas",
  "theMemes.sort.uniquePercent": "% único",
  "theMemes.sort.uniquePercentExMuseum": "% único sin museo",
  "theMemes.sort.floorPrice": "Precio mínimo",
  "theMemes.sort.marketCap": "Capitalización",
  "theMemes.sort.highestOffer": "Oferta más alta",
  "theMemes.volume.trigger": "Volumen",
  "theMemes.volume.triggerWithValue": "Volumen: {volumeType}",
  "theMemes.volume.24Hours": "24 horas",
  "theMemes.volume.7Days": "7 días",
  "theMemes.volume.30Days": "30 días",
  "theMemes.volume.allTime": "Todo el tiempo",
  "home.mintAllowlist.label": "Tu asignación",
  "home.mintAllowlist.allocationsAriaLabel":
    "Asignaciones de mint de la wallet conectada",
  "home.mintAllowlist.connectWallet":
    "Conecta tu wallet para ver los detalles.",
  "home.mintAllowlist.checking": "Comprobando…",
  "home.mintAllowlist.notPublished":
    "Disponible cuando se publique la distribución.",
  "home.mintAllowlist.notFound": "Ninguna para esta wallet.",
  "home.mintAllowlist.unavailable": "No disponible por el momento.",
  "home.mintAllowlist.phase.phase0": "Fase 0",
  "home.mintAllowlist.phase.phase1": "Fase 1",
  "home.mintAllowlist.phase.phase2": "Fase 2",
  "home.mintAllowlist.phase.public": "Pública",
  "home.mintAllowlist.pill.airdrop": "{phase} · {airdrop}x Airdrop",
  "home.mintAllowlist.pill.allowlist": "{phase} · {allowlist}x Allowlist",
  "home.mintAllowlist.pill.mixed":
    "{phase} · {airdrop}x Airdrop · {allowlist}x Allowlist",
  "profilePreferences.notifications.heading": "Notificaciones",
  "profilePreferences.notifications.ALL.label": "Todas",
  "notifications.filter.ariaLabel": "Filtrar notificaciones: {selection}",
  "notifications.filter.selected": "{count} seleccionadas",
  "notifications.filter.sheetTitle": "Filtrar notificaciones",
  "notifications.filter.option.mentions": "Menciones",
  "notifications.filter.option.replies": "Respuestas",
  "notifications.filter.option.identity": "Identidad",
  "notifications.filter.option.reactions": "Reacciones",
  "notifications.filter.option.invites": "Invitaciones",
  "notifications.filter.option.subscriptions": "Suscripciones",
  ...ES_ES_TRANSFER_MESSAGES,
} satisfies Partial<Record<MessageKey, string>>;
