import { DE_DE_DROP_REACTION_MESSAGES } from "@/i18n/messages/drop-reactions";
import { DE_DE_NEW_VERSION_TOAST_MESSAGES } from "@/i18n/messages/new-version-toast";
import { DE_DE_QR_SCANNER_MESSAGES } from "@/i18n/messages/qr-scanner";
import { DE_DE_CAPACITOR_CONNECT_MESSAGES } from "@/i18n/messages/capacitor-connect";
import { DE_DE_PAGINATION_MESSAGES } from "@/i18n/messages/pagination";
import { DE_DE_THE_MEMES_COLLECTORS_MESSAGES } from "@/i18n/messages/the-memes-collectors";
import { DE_DE_TRANSFER_MESSAGES } from "@/i18n/messages/transfer";
import stormComposerDeMessages from "@/i18n/messages/stormComposer.de-DE.json";
import type { MessageKey } from "@/i18n/messages/en-US";

const RETRY_LABEL = "Erneut versuchen";

export const DE_DE_MESSAGES = {
  "user.brain.sidebar.createdHeading": "Erstellte Waves",
  "user.brain.sidebar.createdMobileHeading": "Erstellt",
  "user.brain.sidebar.recentlyActiveHeading": "Kürzlich aktiv in",
  "user.brain.sidebar.lastPost": "Letzter Beitrag {time}",
  "user.brain.sidebar.noPostsByProfile": "Keine Beiträge von diesem Profil",
  "user.brain.sidebar.totalWavePosts.one":
    "{count} Beitrag insgesamt in der Wave",
  "user.brain.sidebar.totalWavePosts.other":
    "{count} Beiträge insgesamt in der Wave",
  "user.brain.sidebar.privateWave": "Private Wave",
  "user.brain.sidebar.loadingWaveActivity":
    "Wave-Aktivität des Profils wird geladen",
  "user.brain.sidebar.loadingMoreWaveActivity":
    "Weitere Wave-Aktivität des Profils wird geladen",
  "user.brain.sidebar.mobileStripLabel": "Brain-Waves",
  "user.brain.sidebar.createdEmpty": "Keine zugänglichen erstellten Waves.",
  "user.brain.sidebar.recentEmpty": "Keine kürzlichen Wave-Beiträge.",
  "user.brain.sidebar.createdLoadError":
    "Erstellte Waves konnten nicht geladen werden.",
  "user.brain.sidebar.recentLoadError":
    "Die kürzliche Wave-Aktivität konnte nicht geladen werden.",
  "user.brain.sidebar.loadMoreError":
    "Weitere Waves konnten nicht geladen werden.",
  "user.brain.sidebar.retry": "Erneut versuchen",
  "user.brain.sidebar.retryLoadMore": "Mehr erneut laden",
  "user.brain.sidebar.loadMore": "Mehr laden",
  "user.brain.sidebar.loadingMore": "Wird geladen…",
  "user.brain.sidebar.allWavesLoaded": "Alle Waves sind geladen.",
  "user.brain.sidebar.more": "Mehr",
  "user.brain.sidebar.showLess": "Weniger anzeigen",
  "user.brain.sidebar.showMore": "Mehr anzeigen",
  "user.brain.sidebar.viewMoreCreatedWaves": "Weitere erstellte Waves anzeigen",
  "user.brain.sidebar.createdModalTitle": "Waves von {profile}",
  "user.brain.sidebar.loadedCreatedCount.one":
    "{count} geladene Wave wird angezeigt",
  "user.brain.sidebar.loadedCreatedCount.other":
    "{count} geladene Waves werden angezeigt",
  "user.brain.sidebar.createdCount.one": "{count} erstellte Wave",
  "user.brain.sidebar.createdCount.other": "{count} erstellte Waves",
  "user.brain.sidebar.closeCreatedWaves": "Erstellte Waves schließen",
  "linkPreview.twitter.kind.article": "Artikel",
  "linkPreview.twitter.kind.post": "Beitrag",
  "linkPreview.twitter.article.provider": "Artikel auf X",
  "linkPreview.twitter.article.read": "Artikel lesen: {title}",
  "waves.drop.actions.copyText": "Text kopieren",
  "waves.drop.actions.copyLink": "Link kopieren",
  "waves.drop.actions.copied": "Kopiert!",
  "waves.drop.actions.copyFailed": "Kopieren fehlgeschlagen",
  "waves.drop.actions.menuLabel": "Drop-Aktionen",
  "waves.drop.actions.reactionPickerLabel": "Reaktion zum Drop hinzufügen",
  "media.video.captions": "Untertitel",
  "media.video.download": "Medien herunterladen",
  "media.video.downloading": "Medien werden heruntergeladen",
  "media.video.exitFullscreen": "Vollbild beenden",
  "media.video.fullscreen": "Vollbild",
  "media.video.mute": "Video stummschalten",
  "media.video.pause": "Video pausieren",
  "media.video.play": "Video abspielen",
  "media.video.player": "Videoplayer",
  "media.video.playPreview": "Videovorschau abspielen",
  "media.video.seek": "Videoposition andern",
  "media.video.unmute": "Videoton einschalten",
  "media.video.unsupported": "Ihr Browser unterstuetzt das Video-Tag nicht.",
  "attachment.safety.ariaLabel": "Geprüfter und validierter Anhang",
  "attachment.safety.badge": "Geprüft und validiert",
  "attachment.safety.heading": "Anhangssicherheit",
  "attachment.safety.hideDetails": "Sicherheitsdetails ausblenden",
  "attachment.safety.sha256": "SHA-256",
  "attachment.safety.size": "Größe {size}",
  "attachment.safety.viewDetails": "Sicherheitsdetails anzeigen",
  "linkPreview.collection.maximumEdition": "Maximale Edition",
  "linkPreview.collection.minted": "Geprägt",
  "linkPreview.collection.mintingLive": "Mint läuft",
  "linkPreview.file.externalSource": "Externe Quelle",
  "linkPreview.file.fact.mime": "MIME",
  "linkPreview.file.fact.size": "Größe",
  "linkPreview.file.kind.archive": "Archiv",
  "linkPreview.file.kind.audio": "Audio",
  "linkPreview.file.kind.binary": "Binär",
  "linkPreview.file.kind.code": "Code",
  "linkPreview.file.kind.csv": "CSV",
  "linkPreview.file.kind.document": "Dokument",
  "linkPreview.file.kind.image": "Bild",
  "linkPreview.file.kind.pdf": "PDF",
  "linkPreview.file.kind.presentation": "Präsentation",
  "linkPreview.file.kind.spreadsheet": "Tabelle",
  "linkPreview.file.kind.text": "Text",
  "linkPreview.file.kind.unknown": "Datei",
  "linkPreview.file.kind.video": "Video",
  "linkPreview.file.openSource": "Quelle öffnen",
  "linkPreview.file.size.unit.B": "B",
  "linkPreview.file.size.unit.GB": "GB",
  "linkPreview.file.size.unit.KB": "KB",
  "linkPreview.file.size.unit.MB": "MB",
  "linkPreview.file.size.value": "{value} {unit}",
  "linkPreview.github.fact.mime": "MIME",
  "linkPreview.github.fact.type": "Typ",
  "linkPreview.github.fileKind": "{kind}-Datei",
  "linkPreview.etherscan.provider": "Etherscan",
  "linkPreview.etherscan.previewLabel":
    "Etherscan-Vorschau für {kind} auf {network}",
  "linkPreview.etherscan.open": "Auf Etherscan öffnen",
  "linkPreview.etherscan.copy": "{kind} kopieren",
  "linkPreview.etherscan.copied": "{kind} kopiert",
  "linkPreview.etherscan.copyFailed": "{kind} konnte nicht kopiert werden",
  "linkPreview.etherscan.retry": RETRY_LABEL,
  "linkPreview.etherscan.loading": "Etherscan-Vorschau wird geladen",
  "linkPreview.etherscan.partial": "Einige Live-Details sind nicht verfügbar",
  "linkPreview.etherscan.liveUnavailable": "Live-Daten nicht verfügbar",
  "linkPreview.etherscan.legacy":
    "Historisches Netzwerk — für diesen archivierten Explorer sind keine Live-Daten verfügbar.",
  "linkPreview.etherscan.status.success": "Erfolgreich",
  "linkPreview.etherscan.status.pending": "Ausstehend",
  "linkPreview.etherscan.status.reverted": "Zurückgesetzt",
  "linkPreview.etherscan.status.finalized": "Finalisiert",
  "linkPreview.etherscan.status.proposed": "Vorgeschlagen",
  "linkPreview.etherscan.status.future": "Zukünftiger Block",
  "linkPreview.etherscan.status.unknown": "Status nicht verfügbar",
  "linkPreview.etherscan.action.nativeTransfer": "{value} ETH gesendet",
  "linkPreview.etherscan.action.tokenTransfer": "Token-Übertragung",
  "linkPreview.etherscan.action.contractCreation": "Vertrag erstellt",
  "linkPreview.etherscan.action.contractInteraction": "Vertragsinteraktion",
  "linkPreview.etherscan.action.transaction": "Ethereum-Transaktion",
  "linkPreview.etherscan.action.compound":
    "Compound {action}: {amount} {token}",
  "linkPreview.etherscan.description.tool":
    "Ein schreibgeschützter Link zu einem Etherscan-Werkzeug. 6529 sendet dessen Formular nicht ab.",
  "linkPreview.etherscan.description.unknown":
    "Eine Etherscan-Seite. Öffne sie, um die vollständige Route zu prüfen.",
  "profileCms.block.audioUnavailable": "Audio nicht verfügbar",
  "profileCms.block.collectionFallback": "Kollektion",
  "profileCms.block.galleryUnavailable": "Galerie nicht verfügbar",
  "profileCms.block.imageUnavailable": "Bild nicht verfügbar",
  "profileCms.block.linkUnavailable": "Link nicht verfügbar",
  "profileCms.block.nftReferenceUnavailable": "NFT-Referenz nicht verfügbar",
  "profileCms.block.openLink": "Link öffnen",
  "profileCms.block.transactionFallback": "Transaktion",
  "profileCms.block.unsupported": "Nicht unterstützter Block",
  "profileCms.block.videoUnavailable": "Video nicht verfügbar",
  "profileCms.builder.agent.error.baseHashMismatch":
    "Der Zielpaket-Hash des Patches stimmt nicht mit dem aktuellen Entwurf überein.",
  "profileCms.builder.agent.error.baseHashMissing":
    "Der Zielpaket-Hash des Patches ist erforderlich.",
  "profileCms.builder.agent.error.baseVersionMismatch":
    "Die Zielversion des Patches ist für den aktuellen Entwurf veraltet.",
  "profileCms.builder.agent.error.blockDuplicateId":
    "Block-ID {id} existiert bereits in diesem Entwurf.",
  "profileCms.builder.agent.error.blockFieldUnsupported":
    "Blockfeld {field} kann nicht durch Agent-Patches bearbeitet werden.",
  "profileCms.builder.agent.error.blockStructuralMix":
    "Strukturelle Blockoperationen können nicht mit anderen Blockmutationen in einem Patch kombiniert werden.",
  "profileCms.builder.agent.error.codeLabel": "Code: {code}",
  "profileCms.builder.agent.error.jsonInvalid":
    "Patch-JSON konnte nicht analysiert werden.",
  "profileCms.builder.agent.error.metadataFieldUnsupported":
    "Metadatenfeld {field} kann nicht durch Agent-Patches bearbeitet werden.",
  "profileCms.builder.agent.error.navigationMissing":
    "Builder-Entwurf enthält kein bearbeitbares Navigationselement.",
  "profileCms.builder.agent.error.operationUnsupported":
    "Builder-Überprüfung unterstützt nicht {op}.",
  "profileCms.builder.agent.error.pageMissing":
    "Builder-Entwurf enthält keine bearbeitbare Homepage.",
  "profileCms.builder.agent.error.pathUnsupported":
    "Builder-Überprüfung kann Pfad {path} nicht anwenden.",
  "profileCms.builder.agent.error.schemaInvalid":
    "Patch-JSON entspricht nicht dem Agent-Patch-Schema.",
  "profileCms.builder.agent.error.targetDraftMismatch":
    "Die Ziel-Entwurfs-ID des Patches stimmt nicht mit dem aktuellen Entwurf überein.",
  "profileCms.builder.agent.error.validationRejected":
    "Lokale Paketvalidierung hat diese Änderung abgelehnt ({code}).",
  "profileCms.builder.agent.error.valueInvalid":
    "Patch-Wert ist für diese Operation ungültig.",
  "profileCms.builder.agent.packet.authorCopy": "Autorenkopie",
  "profileCms.builder.agent.packet.derivedMetadata": "Abgeleitete Metadaten",
  "profileCms.builder.agent.packet.facts": "Fakten",
  "profileCms.builder.agent.packet.label.assets": "Assets",
  "profileCms.builder.agent.packet.label.baseVersion": "Basisversion",
  "profileCms.builder.agent.packet.label.blocks": "Blöcke",
  "profileCms.builder.agent.packet.label.canonical": "Kanonisch",
  "profileCms.builder.agent.packet.label.draft": "Entwurf",
  "profileCms.builder.agent.packet.label.issues": "Probleme",
  "profileCms.builder.agent.packet.label.navigation": "Navigation",
  "profileCms.builder.agent.packet.label.package": "Paket",
  "profileCms.builder.agent.packet.label.packageHash": "Paket-Hash",
  "profileCms.builder.agent.packet.label.page": "Seite",
  "profileCms.builder.agent.packet.label.payloadHash": "Nutzlast-Hash",
  "profileCms.builder.agent.packet.label.profile": "Profil",
  "profileCms.builder.agent.packet.label.route": "Route",
  "profileCms.builder.agent.packet.label.site": "Website",
  "profileCms.builder.agent.packet.label.status": "Status",
  "profileCms.builder.agent.packet.label.writable": "Beschreibbar",
  "profileCms.builder.agent.packet.safety": "Quellregeln",
  "profileCms.builder.agent.packet.validation": "Validierungsdiagnose",
  "profileCms.builder.agent.packet.value.no": "Nein",
  "profileCms.builder.agent.packet.value.yes": "Ja",
  "profileCms.builder.agent.patch.accepted":
    "Patch validiert gegen den aktuellen Entwurf.",
  "profileCms.builder.agent.patch.applied":
    "Patch auf diesen Entwurf angewendet.",
  "profileCms.builder.agent.patch.apply": "Auf Entwurf anwenden",
  "profileCms.builder.agent.patch.description":
    "Fügen Sie einen Agent-Patch ein oder laden Sie ihn hoch, überprüfen Sie den Diff und wenden Sie ihn auf diesen Entwurf an.",
  "profileCms.builder.agent.patch.diff": "Vorgeschlagener Diff",
  "profileCms.builder.agent.patch.fileTooLarge":
    "Patch-Datei ist zu groß. Fügen Sie einen kleineren JSON-Patch ein.",
  "profileCms.builder.agent.patch.label": "Agent-Patch-JSON",
  "profileCms.builder.agent.patch.rejected":
    "Patch wurde abgelehnt, bevor es den Entwurf ändern konnte.",
  "profileCms.builder.agent.patch.review": "Patch überprüfen",
  "profileCms.builder.agent.patch.title": "Patch-Überprüfung",
  "profileCms.builder.agent.patch.upload": "Patch hochladen",
  "profileCms.builder.agent.source.description":
    "Exportieren Sie den Entwurfskontext für lokale Tools und überprüfen Sie die Paketgrenzen.",
  "profileCms.builder.agent.source.title": "Quellpaket",
  "profileCms.builder.api.disabled":
    "Builder-API-Schreibvorgänge sind in dieser Frontend-Umgebung nicht aktiviert.",
  "profileCms.builder.api.draftSaved": "Entwurf gespeichert.",
  "profileCms.builder.api.failed": "Builder-API-Aktion fehlgeschlagen.",
  "profileCms.builder.api.missingDraftId":
    "Speichern Sie einen Entwurf, bevor Sie eine Veröffentlichung anfordern.",
  "profileCms.builder.api.missingProfileId":
    "Diese Route konnte keine Profil-ID für die Builder-API auflösen.",
  "profileCms.builder.api.profileNotAuthorized":
    "Verbinden Sie sich mit diesem Profil, bevor Sie Backend-Builder-Aktionen verwenden.",
  "profileCms.builder.api.publishRequiresSignedStorage":
    "Veröffentlichung erfordert den signierten dezentralisierten Speicherfluss und ist in diesem MVP nicht aktiviert.",
  "profileCms.builder.api.serverValidationCompleted":
    "Server-Validierung abgeschlossen.",
  "profileCms.builder.block.body": "Inhalt",
  "profileCms.builder.block.buttonLabel": "Schaltflächenbeschriftung",
  "profileCms.builder.block.buttonLink": "Schaltflächenlink",
  "profileCms.builder.block.buttonUrl": "Schaltflächen-URL",
  "profileCms.builder.block.callout": "Callout",
  "profileCms.builder.block.calloutTitle": "Callout-Titel",
  "profileCms.builder.block.caption": "Bildunterschrift",
  "profileCms.builder.block.citation": "Zuschreibung",
  "profileCms.builder.block.heading": "Überschrift",
  "profileCms.builder.block.headingText": "Überschrifttext",
  "profileCms.builder.block.image": "Bild",
  "profileCms.builder.block.imageAlt": "Bildalternativtext",
  "profileCms.builder.block.imageUri": "Bild-URI",
  "profileCms.builder.block.quote": "Zitat",
  "profileCms.builder.block.quoteText": "Zitierter Text",
  "profileCms.builder.block.remove": "Entfernen",
  "profileCms.builder.block.richText": "Formatierter Text",
  "profileCms.builder.block.roomImageUri": "Raumwerk-URI",
  "profileCms.builder.block.roomStyle": "Raumstil",
  "profileCms.builder.block.roomStyle.darkRoom": "Dunkler Raum",
  "profileCms.builder.block.roomStyle.salon": "Salon",
  "profileCms.builder.block.roomStyle.wall": "Einfache Wand",
  "profileCms.builder.block.roomStyle.whiteCube": "White Cube",
  "profileCms.builder.block.roomTitle": "Raumwerk-Titel",
  "profileCms.builder.block.roomViewer": "3D-Raum",
  "profileCms.builder.block.tone": "Ton",
  "profileCms.builder.blocks.title": "Blöcke",
  "profileCms.builder.cta.publish": "Veröffentlichen",
  "profileCms.builder.cta.saveDraft": "Entwurf speichern",
  "profileCms.builder.cta.serverValidate": "Server-Validierung",
  "profileCms.builder.field.navigationLabel": "Primäre Navigationsbeschriftung",
  "profileCms.builder.field.pageDescription": "Seitenbeschreibung",
  "profileCms.builder.field.pageTitle": "Seitentitel",
  "profileCms.builder.field.siteDescription": "Website-Beschreibung",
  "profileCms.builder.field.siteTitle": "Website-Titel",
  "profileCms.builder.field.socialImageAsset": "Social-Image-Asset-ID",
  "profileCms.builder.field.themeAccent": "Design-Akzent",
  "profileCms.builder.gallery.assets.empty": "Keine Werke gefunden.",
  "profileCms.builder.gallery.assets.feature": "Werk hervorheben",
  "profileCms.builder.gallery.assets.hide": "Ausblenden",
  "profileCms.builder.gallery.assets.mediaPartial": "Medien ausstehend",
  "profileCms.builder.gallery.assets.mediaReady": "Medien bereit",
  "profileCms.builder.gallery.assets.moveDown": "Nach unten verschieben",
  "profileCms.builder.gallery.assets.moveUp": "Nach oben verschieben",
  "profileCms.builder.gallery.assets.owner": "Besitzer: {owner}",
  "profileCms.builder.gallery.assets.title": "Werke",
  "profileCms.builder.gallery.assets.unfeature": "Hervorhebung entfernen",
  "profileCms.builder.gallery.assets.unhide": "Anzeigen",
  "profileCms.builder.gallery.collections.count": "{count} sichtbare Werke",
  "profileCms.builder.gallery.collections.feature": "Sammlung hervorheben",
  "profileCms.builder.gallery.collections.title": "Hervorgehobene Sammlungen",
  "profileCms.builder.gallery.collections.unfeature": "Hervorhebung entfernen",
  "profileCms.builder.gallery.review.description":
    "Überprüfen Sie den eingefrorenen Wallet-Snapshot, bevor Sie das generierte Galerie-Paket speichern.",
  "profileCms.builder.gallery.review.empty":
    "Fordern Sie einen Wallet-Snapshot an, um Assets, Sammlungen, Medienstatus und generierte Vorschau zu überprüfen.",
  "profileCms.builder.gallery.review.title": "Snapshot-Überprüfung",
  "profileCms.builder.gallery.settings": "Galerieeinstellungen",
  "profileCms.builder.gallery.snapshot.api": "Server-Snapshot",
  "profileCms.builder.gallery.snapshot.failed":
    "Galerie-Snapshot konnte nicht erstellt werden.",
  "profileCms.builder.gallery.snapshot.fixture": "Fixture-Snapshot",
  "profileCms.builder.gallery.snapshot.loading": "Wird angefordert...",
  "profileCms.builder.gallery.snapshot.loadingDetail":
    "Sammeln von Beständen und Medienkandidaten zur Überprüfung.",
  "profileCms.builder.gallery.snapshot.request": "Snapshot anfordern",
  "profileCms.builder.gallery.snapshot.warning.fixtureBackendDisabled":
    "Fixture-Snapshot wird verwendet, bis der Galerie-Backend-Snapshot-Endpunkt aktiviert ist.",
  "profileCms.builder.gallery.snapshot.warning.partialMedia":
    "Einige Medien können im überprüften Snapshot ausstehend oder nicht verfügbar sein.",
  "profileCms.builder.gallery.summary.hidden": "Verborgene Werke",
  "profileCms.builder.gallery.summary.partial": "Teilmedien",
  "profileCms.builder.gallery.summary.visible": "Sichtbare Werke",
  "profileCms.builder.gallery.summary.wallets": "Wallets",
  "profileCms.builder.gallery.wallets.emptyError":
    "Geben Sie mindestens eine ETH-Adresse oder einen ENS-Namen ein.",
  "profileCms.builder.gallery.wallets.help":
    "Fügen Sie eine oder mehrere ETH-Adressen oder ENS-Namen ein, getrennt durch Kommas, Leerzeichen oder Zeilenumbrüche.",
  "profileCms.builder.gallery.wallets.invalidError":
    "Diese Wallet-Einträge benötigen Aufmerksamkeit: {entries}",
  "profileCms.builder.gallery.wallets.label": "Wallets oder ENS-Namen",
  "profileCms.builder.gallery.wallets.title": "Wallet-Quellen",
  "profileCms.builder.json.downloadPackage": "Paket-JSON herunterladen",
  "profileCms.builder.json.downloadSchemaBundle": "Schemas herunterladen",
  "profileCms.builder.json.downloadSourcePacket": "Quellpaket herunterladen",
  "profileCms.builder.json.import": "JSON importieren",
  "profileCms.builder.json.importFailed":
    "Paket-JSON konnte nicht importiert werden.",
  "profileCms.builder.json.label": "Paketkandidat",
  "profileCms.builder.json.title": "Paket-JSON",
  "profileCms.builder.pageDescription":
    "Erstellen und Vorschau eines profil-nativen CMS-Site-Pakets.",
  "profileCms.builder.pageSettings": "Homepage-Einstellungen",
  "profileCms.builder.pageTitle": "Profil-CMS-Builder",
  "profileCms.builder.publishState.draftId": "Entwurfs-ID",
  "profileCms.builder.publishState.noDraft": "Kein gespeicherter Entwurf",
  "profileCms.builder.publishState.packageHash": "Paket-Hash",
  "profileCms.builder.publishState.payloadHash": "Nutzlast-Hash",
  "profileCms.builder.publishState.pending":
    "Speichern und Veröffentlichen erfordern die Backend-Builder-Endpunkte. Diese Benutzeroberfläche wird keine Produktionsveröffentlichung simulieren.",
  "profileCms.builder.publishState.title":
    "Entwurfs- und Veröffentlichungsstatus",
  "profileCms.builder.siteSettings": "Website-Einstellungen",
  "profileCms.builder.tab.agent": "Agent",
  "profileCms.builder.tab.editor": "Editor",
  "profileCms.builder.tab.json": "JSON",
  "profileCms.builder.tab.preview": "Vorschau",
  "profileCms.builder.templates.gallery": "Galerie",
  "profileCms.builder.templates.homepage": "Basis-Homepage",
  "profileCms.builder.templates.room": "3D-Raum",
  "profileCms.builder.templates.status.comingSoon": "Kommt bald",
  "profileCms.builder.templates.title": "Website-Vorlage",
  "profileCms.builder.templates.walletGallery": "Wallet-Galerie",
  "profileCms.builder.validation.focusField": "Fokusfeld",
  "profileCms.builder.validation.invalid": "Paketkandidat benötigt Änderungen.",
  "profileCms.builder.validation.issueDetail":
    "Überprüfen Sie dieses Feld vor dem Speichern oder Veröffentlichen.",
  "profileCms.builder.validation.noIssues": "Keine Validierungsprobleme.",
  "profileCms.builder.validation.severity.error": "Fehler",
  "profileCms.builder.validation.severity.warning": "Warnung",
  "profileCms.builder.validation.title": "Validierung",
  "profileCms.builder.validation.valid": "Paketkandidat ist gültig.",
  "profileCms.builder.workspaceLabel": "CMS-Builder-Arbeitsbereich",
  "profileCms.error.description":
    "Diese Profil-Website konnte nicht gerendert werden.",
  "profileCms.error.retry": RETRY_LABEL,
  "profileCms.error.title": "Website nicht verfügbar",
  "profileCms.header.openWebsite": "Website {handle} öffnen",
  "profileCms.header.website": "Website",
  "profileCms.interactive.budgetWarning":
    "Dieses 3D-Asset überschreitet das deklarierte Performance-Budget, sodass das Laden langsam sein kann.",
  "profileCms.interactive.canvasLabel": "Interaktive 3D-Vorschau",
  "profileCms.interactive.deepZoom.description":
    "Dieser V1-Renderer hält Deep Zoom statisch, bis der interaktive Viewer aktiviert wird.",
  "profileCms.interactive.deepZoom.title": "Deep-Zoom-Vorschau",
  "profileCms.interactive.embed.description":
    "Dieses Embed ist nicht für geschützte Darstellung gekennzeichnet.",
  "profileCms.interactive.embed.iframeTitle":
    "Eingebettete Profil-Website-Medien",
  "profileCms.interactive.embed.title": "Vorschau eingebetteter Medien",
  "profileCms.interactive.enterRoom": "Raum betreten",
  "profileCms.interactive.exitFullscreen": "Vollbild beenden",
  "profileCms.interactive.fullscreen": "Vollbild",
  "profileCms.interactive.loadError":
    "Die 3D-Vorschau konnte nicht geladen werden. Verwenden Sie die unten stehenden 2D-Links.",
  "profileCms.interactive.loadObject": "3D-Objekt laden",
  "profileCms.interactive.loading": "Wird geladen {progress}%",
  "profileCms.interactive.mobileFallback":
    "Diese Mobilansicht verwendet das statische Poster und 2D-Links für ein leichteres, zuverlässigeres Erlebnis.",
  "profileCms.interactive.object.description":
    "Laden Sie den GLB- oder glTF-Viewer, wenn Sie bereit sind, das Modell zu überprüfen.",
  "profileCms.interactive.object.title": "3D-Objekt-Vorschau",
  "profileCms.interactive.openFallback": "2D-Alternative öffnen",
  "profileCms.interactive.openSourceMedia": "Quellenmedien öffnen",
  "profileCms.interactive.room.description":
    "Betreten Sie einen einfachen Ausstellungsraum. Jedes Kunstwerk verlinkt immer noch auf seine kanonische 2D-Detailseite.",
  "profileCms.interactive.room.title": "Raum-Vorschau",
  "profileCms.interactive.roomWorksLabel": "Raumkunstwerke",
  "profileCms.media.captionTrackLabel": "Beschreibung",
  "profileCms.media.noCaptions":
    "Für dieses Medienelement wurden keine Untertitel bereitgestellt.",
  "profileCms.nav.label": "{siteTitle} Navigation",
  "profileCms.reference.chain": "Kette {chainId}",
  "profileCms.reference.tokenTitle": "Token #{tokenId}",
  "profileCms.state.empty.description":
    "Diese Profil-Website ist veröffentlicht, aber diese Seite ist nicht verfügbar.",
  "profileCms.state.empty.title": "Website-Seite nicht gefunden",
  "profileCms.state.eyebrow": "Profil-Website",
  "profileCms.state.loading.title": "Website wird geladen",
  "profileCms.state.routeUnavailable.title": "Website-Route nicht verfügbar",
  "profileCms.walletGallery.blockNumber": "Block",
  "profileCms.walletGallery.capturedAt": "Erfasst",
  "profileCms.walletGallery.summary.many": "{count} Wallets",
  "profileCms.walletGallery.summary.one": "{count} Wallet",
  "profileCms.walletGallery.title": "Wallet-Galerie",
  "drop.media.alt": "Drop-Medium",
  "drop.media.processing": "Bild wird verarbeitet",
  "drop.media.loading": "Bild wird geladen",
  "drop.media.unavailable": "Bild nicht verfuegbar",
  "drop.media.loadFailed": "Bild konnte nicht geladen werden.",
  "drop.media.retry": RETRY_LABEL,
  "drop.media.openPreview": "Bildvorschau oeffnen",
  "drop.media.openMedia": "Drop-Medium oeffnen",
  "drop.media.saveDialogTitle": "Bild speichern",
  "drop.media.processingFailed": "Bildverarbeitung fehlgeschlagen.",
  "drop.media.processingTimedOut": "Zeitlimit fuer Bildverarbeitung erreicht.",
  "quickDm.regionAriaLabel": "Schnelle Direktnachrichten",
  "quickDm.openButtonAriaLabel": "Schnelle Direktnachrichten öffnen",
  "quickDm.openButtonUnreadAriaLabel":
    "Schnelle Direktnachrichten öffnen, {count} ungelesene Nachrichten",
  "quickDm.openButtonTitle": "Direktnachrichten",
  "quickDm.listTitle": "Nachrichten",
  "quickDm.chatTitleFallback": "Nachrichten",
  "quickDm.closeAriaLabel": "Schnelle Direktnachrichten schließen",
  "quickDm.backAriaLabel": "Zurück zur Direktnachrichtenliste",
  "quickDm.openAll": "Alle Nachrichten öffnen",
  "quickDm.openAllAriaLabel": "Alle Direktnachrichten öffnen",
  "quickDm.showAll": "Alle anzeigen",
  "quickDm.openConversation": "Konversation öffnen",
  "quickDm.openConversationAriaLabel": "Konversation mit {name} öffnen",
  "quickDm.unreadCountAriaLabel": "{count} ungelesene Nachrichten",
  "quickDm.unreadPreview": "Neue Nachrichten",
  "quickDm.noMessagesYet": "Noch keine Nachrichten",
  "quickDm.emptyTitle": "Noch keine Direktnachrichten",
  "quickDm.loadingStatus": "Direktnachrichten werden geladen",
  "quickDm.chatLoadError": "Diese Konversation konnte nicht geladen werden.",
  ...DE_DE_QR_SCANNER_MESSAGES,
  ...DE_DE_CAPACITOR_CONNECT_MESSAGES,
  ...DE_DE_NEW_VERSION_TOAST_MESSAGES,
  "waves.chat.fileUploadAreaAriaLabel":
    "Datei-Upload-Bereich für den Wave-Chat",
  "waves.chat.guidelinesDialog.title": "Wave-Richtlinien",
  "waves.chat.guidelinesDialog.description":
    "Sieh dir die Richtlinien dieser Wave an, bevor du deine erste Nachricht sendest.",
  "waves.chat.guidelinesDialog.guidelinesLabel": "Richtlinien",
  "waves.chat.guidelinesDialog.actionHint":
    "Mit „Zustimmen“ wird deine Nachricht gesendet. Mit „Ablehnen“ bleibt sie als Entwurf erhalten.",
  "waves.chat.guidelinesDialog.agree": "Zustimmen",
  "waves.chat.guidelinesDialog.decline": "Ablehnen",
  "waves.chat.guidelinesDialog.loadErrorTitle":
    "Wave-Richtlinien konnten nicht geladen werden.",
  "waves.chat.guidelinesDialog.loadErrorDescription":
    "Versuche es erneut, bevor du deine Nachricht sendest.",
  ...stormComposerDeMessages,
  "waves.loadingStatus": "Waves werden geladen",
  "waves.gifPicker.open": "GIF hinzufügen",
  "waves.gifPicker.dialogTitle": "GIF-Suche",
  "waves.gifPicker.searchPlaceholder": "GIFs suchen",
  "waves.gifPicker.noResults": "Keine GIFs gefunden.",
  "waves.gifPicker.poweredBy": "Bereitgestellt von {brandName}",
  "waves.gifPicker.poweredByPrefix": "Bereitgestellt von",
  "waves.gifPicker.status.checking": "GIF-Suche wird geprueft...",
  "waves.gifPicker.status.ready": "GIF-Suche ist bereit.",
  "waves.gifPicker.unavailable.title":
    "GIF-Suche ist voruebergehend nicht verfuegbar.",
  "waves.gifPicker.unavailable.hint":
    "Du kannst stattdessen eine GIF-Datei hochladen.",
  "common.close": "Schliessen",
  "waves.create.dialog.subwaveTitle": "Subwave erstellen",
  "waves.create.dialog.waveTitle": "Wave erstellen",
  "waves.create.actions.cancel": "Abbrechen",
  "waves.create.actions.backToCriteria": "Zurück zu den Kriterien",
  "waves.create.actions.complete": "Abschließen",
  "waves.create.actions.next": "Weiter",
  "waves.create.actions.previous": "Zurück",
  "waves.create.actions.save": "Speichern",
  "waves.create.advanced.title": "Erweiterte Einstellungen",
  "waves.create.advanced.customized": "Angepasst",
  "waves.create.advanced.needsAttention": "Prüfen",
  "waves.create.advanced.errorSummary":
    "Prüfe die markierten Einstellungen, bevor du fortfährst.",
  "waves.create.overview.title": "Wave erstellen",
  "waves.create.overview.picture": "Wave-Bild",
  "waves.create.overview.advancedTitle": "Darstellung und Bezeichnungen",
  "waves.create.overview.displaySettings": "Anzeigeeinstellungen",
  "waves.create.groups.title": "Zugriff",
  "waves.create.groups.description":
    "Lege fest, wer auf diese Wave zugreifen, teilnehmen und sie verwalten kann.",
  "waves.create.groups.viewGroupName": "Sichtbarkeit",
  "waves.create.groups.adminGroupName": "Administratoren",
  "waves.create.groups.currentGroupWithName": "Aktuelle Gruppe: {name}",
  "waves.create.groups.dialog.addTitle": "Gruppe hinzufügen",
  "waves.create.groups.dialog.changeTitle": "Gruppe ändern",
  "waves.create.groups.dialog.addDescription":
    "Erstelle eine neue Gruppe oder wähle eine vorhandene aus.",
  "waves.create.groups.dialog.changeDescription":
    "Erstelle eine neue Gruppe oder wähle eine andere vorhandene aus.",
  "waves.create.groups.members.currentCount.one": "{count} Benutzer",
  "waves.create.groups.members.currentCount.other": "{count} Benutzer",
  "waves.create.groups.members.countLoading":
    "Aktuelle Zielgruppe wird geprüft…",
  "waves.create.groups.members.countUnavailable":
    "Aktuelle Zielgruppe nicht verfügbar",
  "waves.create.groups.members.view": "Mitglieder anzeigen",
  "waves.create.groups.members.previewDraft": "Treffer ansehen",
  "waves.create.groups.members.dialogTitle": "{role}: {group}",
  "waves.create.groups.members.dynamicDescription":
    "Diese Live-Vorschau basiert auf aktuellen Profil-, Reputations- und Besitzdaten. Die Mitgliedschaft kann sich ändern.",
  "waves.create.groups.members.criteriaSummary":
    "Warum diese Identitäten berechtigt sind",
  "waves.create.groups.members.criteriaUnavailable":
    "Die Gruppenkriterien sind nicht verfügbar. Die aktuellen Mitglieder können unten weiterhin angezeigt werden.",
  "waves.create.groups.members.searchLabel": "Identität suchen",
  "waves.create.groups.members.searchPlaceholder":
    "Nach Handle oder Wallet suchen",
  "waves.create.groups.members.clearSearch": "Identitätssuche leeren",
  "waves.create.groups.members.loadingStatus":
    "Aktuelle Mitglieder werden geladen",
  "waves.create.groups.members.empty":
    "Derzeit entspricht keine Identität dieser Gruppe.",
  "waves.create.groups.members.searchEmpty":
    "Keine passenden Identitäten gefunden.",
  "waves.create.groups.members.errorTitle":
    "Aktuelle Mitglieder konnten nicht geladen werden.",
  "waves.create.groups.members.errorDescription":
    "Prüfe deine Verbindung und versuche es erneut.",
  "waves.create.groups.members.retry": RETRY_LABEL,
  "waves.create.groups.members.listLabel": "Aktuelle Gruppenmitglieder",
  "waves.create.groups.members.openProfile":
    "Profil von {identity} in einem neuen Tab öffnen",
  "waves.create.groups.members.criteria.metric.tdh": "TDH",
  "waves.create.groups.members.criteria.metric.xtdh": "xTDH",
  "waves.create.groups.members.criteria.metric.tdhAndXtdh": "TDH + xTDH",
  "waves.create.groups.members.criteria.metric.rep": "REP",
  "waves.create.groups.members.criteria.metric.nic": "NIC",
  "waves.create.groups.members.criteria.metric.level": "Stufe",
  "waves.create.groups.members.criteria.range.atMost":
    "{metric} höchstens {max}",
  "waves.create.groups.members.criteria.range.atLeast":
    "{metric} mindestens {min}",
  "waves.create.groups.members.criteria.range.between":
    "{metric} zwischen {min} und {max}",
  "waves.create.groups.members.criteria.identityRange.atMost":
    "{metric} {direction} {identity} höchstens {max}",
  "waves.create.groups.members.criteria.identityRange.atLeast":
    "{metric} {direction} {identity} mindestens {min}",
  "waves.create.groups.members.criteria.identityRange.between":
    "{metric} {direction} {identity} zwischen {min} und {max}",
  "waves.create.groups.members.criteria.identity":
    "{metric} {direction} {identity}",
  "waves.create.groups.members.criteria.categoryRange.atMost":
    "{metric} in {category} höchstens {max}",
  "waves.create.groups.members.criteria.categoryRange.atLeast":
    "{metric} in {category} mindestens {min}",
  "waves.create.groups.members.criteria.categoryRange.between":
    "{metric} in {category} zwischen {min} und {max}",
  "waves.create.groups.members.criteria.category": "{metric} in {category}",
  "waves.create.groups.members.criteria.categoryIdentityRange.atMost":
    "{metric} in {category} {direction} {identity} höchstens {max}",
  "waves.create.groups.members.criteria.categoryIdentityRange.atLeast":
    "{metric} in {category} {direction} {identity} mindestens {min}",
  "waves.create.groups.members.criteria.categoryIdentityRange.between":
    "{metric} in {category} {direction} {identity} zwischen {min} und {max}",
  "waves.create.groups.members.criteria.categoryIdentity":
    "{metric} in {category} {direction} {identity}",
  "waves.create.groups.members.criteria.from": "von",
  "waves.create.groups.members.criteria.to": "an",
  "waves.create.groups.members.criteria.included.one":
    "{count} ausdrücklich eingeschlossener Benutzer",
  "waves.create.groups.members.criteria.included.other":
    "{count} ausdrücklich eingeschlossene Benutzer",
  "waves.create.groups.members.criteria.excluded.one":
    "{count} ausdrücklich ausgeschlossener Benutzer",
  "waves.create.groups.members.criteria.excluded.other":
    "{count} ausdrücklich ausgeschlossene Benutzer",
  "waves.create.groups.members.criteria.grant": "xTDH-Zuschuss {grantId}",
  "waves.create.groups.validation.checking": "Gruppenzugriff wird geprüft…",
  "waves.create.groups.validation.unavailableTitle":
    "Der Gruppenzugriff konnte nicht geprüft werden.",
  "waves.create.groups.validation.unavailable":
    "Der Gruppenzugriff konnte nicht geprüft werden. Versuche es erneut, bevor du fortfährst.",
  "waves.create.groups.validation.outsideView":
    "Die Gruppe „{groupName}“ enthält Personen, die nicht in „{viewGroupName}“ sind.",
  "waves.create.groups.validation.invalidTitle":
    "Einige Zugriffsgruppen müssen angepasst werden.",
  "waves.create.groups.validation.invalidDescription":
    "Alle Mitglieder der Einreichungs-, Abstimmungs-, Chat- und Admin-Gruppen müssen auch der Ansichtsgruppe angehören.",
  "waves.create.dates.title": "Zeitplan",
  "waves.create.dates.description":
    "Prüfe, wann diese Wave startet, die Abstimmung beginnt und Gewinner bekannt gegeben werden.",
  "waves.create.dates.approve.noEndSummary": "Startet {start}. Kein Enddatum.",
  "waves.create.dates.approve.endSummary": "Startet {start}. Endet {end}.",
  "waves.create.dates.approve.endInfoLabel": "Informationen zum Wave-Ende",
  "waves.create.dates.approve.advancedSummary": "Wave-Ende",
  "waves.create.dates.rank.ongoingSummary":
    "Einreichungen starten {submission}. Die Abstimmung startet {voting}. Das Ranking bleibt offen.",
  "waves.create.dates.rank.scheduledSummary":
    "Einreichungen starten {submission}. Die Abstimmung startet {voting}. Erste Gewinner: {announcement}.",
  "waves.create.dates.rank.advancedSummary": "Gewinnerzeitplan",
  "waves.create.drops.requirementsTitle": "Einreichungsanforderungen",
  "waves.create.rules.advancedSummary": "Wave-Richtlinien und Zustimmung",
  "waves.create.rules.chatAdvancedSummary": "Wave-Richtlinien",
  "waves.create.rules.guidelinesSettingsLabel": "Richtlinien",
  "waves.create.rules.guidelinesSettingsEditLabel": "Richtlinien bearbeiten",
  "waves.create.rules.guidelinesSettingsAdded": "Hinzugefügt",
  "waves.create.rules.guidelinesSettingsNone": "Keine",
  "waves.create.rules.guidelinesAuthError":
    "Authentifizierung fehlgeschlagen. Verbinde deine Wallet erneut und versuche es noch einmal.",
  "waves.create.rules.guidelinesSaveError":
    "Diese Richtlinien konnten nicht gespeichert werden. Versuche es noch einmal.",
  "waves.create.rules.guidelinesSaveErrorTitle":
    "Diese Richtlinien konnten nicht gespeichert werden.",
  "waves.create.rules.guidelinesSaveErrorDescription":
    "Versuche es noch einmal.",
  "waves.create.voting.rankAdvancedSummary": "Abstimmungslimits und -verhalten",
  "waves.create.voting.approveAdvancedSummary":
    "Abstimmungslimits, -verhalten und -zeitplan",
  "waves.create.outcomes.rankAdvancedSummary": "Sichtbarkeit der Ergebnisse",
  "waves.create.outcomes.approveAdvancedSummary": "Gewinnerlimits",
  "waves.create.drops.maxSimultaneousSubmissions.label":
    "Maximale gleichzeitige Einreichungen",
  "waves.create.drops.maxSimultaneousSubmissions.description":
    "Maximale Anzahl gleichzeitiger Einreichungen pro Teilnehmer. Optional. Leer lassen für unbegrenzt.",
  "waves.proposalCard.contextLabel": "Vorschlag",
  "waves.proposalCard.readFull": "Vollständig lesen",
  "waves.proposalCard.readFullNamed": "Vollständig lesen: {title}",
  "waves.proposalCard.untitledProposal": "Unbenannter Vorschlag",
  "waves.proposalCard.previewAlt": "Medienvorschau für {title}",
  "waves.proposalCard.part.one": "{count} Teil",
  "waves.proposalCard.part.other": "{count} Teile",
  "waves.proposalCard.media.one": "{count} Medienelement",
  "waves.proposalCard.media.other": "{count} Medienelemente",
  "waves.proposalCard.attachment.one": "{count} Anhang",
  "waves.proposalCard.attachment.other": "{count} Anhänge",
  "waves.proposalCard.appearanceLabel": "Darstellung der Vorschlagskarte",
  "waves.proposalCard.mode.standard.label": "Vollständiger Vorschlag",
  "waves.proposalCard.mode.standard.description":
    "Originalinhalt direkt im Feed anzeigen.",
  "waves.proposalCard.mode.custom.label": "Zusammenfassungskarte",
  "waves.proposalCard.mode.custom.description":
    "Titel, gekürzten Text und optional ein Bild anzeigen.",
  "waves.proposalCard.excerptLabel": "Limit der Textvorschau",
  "waves.proposalCard.excerptInputAriaLabel":
    "Maximale Zeichenanzahl der Vorschau",
  "waves.proposalCard.characters": "Zeichen",
  "waves.proposalCard.excerptRangeError":
    "Gib eine ganze Zahl von {min} bis {max} ein.",
  "waves.proposalCard.mediaLabel": "Bild auf der Zusammenfassungskarte",
  "waves.proposalCard.settings.editLabel":
    "Einstellungen der Vorschlagskarte bearbeiten",
  "waves.proposalCard.settings.layoutLabel": "Vorschlagslayout",
  "waves.proposalCard.settings.rowLabel": "Vorschlagskarten",
  "waves.proposalCard.settings.toastAuthFailed":
    "Authentifizierung fehlgeschlagen. Verbinde deine Wallet erneut und versuche es noch einmal.",
  "waves.proposalCard.settings.toastSaveFailedTitle":
    "Diese Einstellungen der Vorschlagskarte konnten nicht gespeichert werden.",
  "waves.proposalCard.settings.toastRetry": "Bitte versuche es erneut.",
  "waves.proposalCard.tabLabelsLabel": "Tab-Bezeichnungen",
  "waves.proposalCard.tabLabelsDescription":
    "Namen, die in den Tabs dieser Wave angezeigt werden.",
  "waves.proposalCard.approvalsTabLabel": "Bezeichnung des Vorschlags-Tabs",
  "waves.proposalCard.approvedTabLabel": "Bezeichnung des Genehmigt-Tabs",
  "waves.proposalCard.tabLabels.errorTooLong":
    "Bezeichnungen dürfen höchstens {max} Zeichen lang sein.",
  "waves.proposalCard.tabLabels.errorDuplicate":
    "Verwende zwei unterschiedliche Tab-Bezeichnungen.",
  "waves.proposalCard.tabLabels.errorReserved":
    "Bezeichnungen dürfen nicht mit vorhandenen Tabs übereinstimmen.",
  ...DE_DE_PAGINATION_MESSAGES,
  "memes.quickVote.leftThisRound": "{count} in dieser Runde übrig",
  "memes.quickVote.unrated": "{count} unbewertet",
  "memes.quickVote.summary": "{leftThisRound}, {unrated}",
  "memes.quickVote.inMemesWave": "{leftThisRound}, {unrated} in der Memes-Wave",
  "memes.waveFooter.quickVote.label": "Schnellvoting",
  "memes.waveFooter.quickVote.open": "Schnellvoting öffnen",
  "memes.waveFooter.uncastPower.ariaLabel":
    "Nicht vergebene Power, {power} {votingLabel} übrig, {leftThisRound}, {unrated}",
  "memes.waveFooter.uncastPower.title": "Nicht vergebene Power",
  "memes.waveFooter.uncastPower.visibleValue": "{power} {votingLabel}",
  "memes.waveFooter.uncastPower.votes": "Stimmen",
  "memes.waveFooter.uncastPower.votesVisible": "Stimmen",
  ...DE_DE_DROP_REACTION_MESSAGES,
  "waves.mobile.profileFeed.title": "Profile-Waves-Feed",
  "waves.mobile.profileFeed.subtitle": "Ausgewählte Drops aus Profile-Waves",
  "waves.leaderboard.listLabel": "Leaderboard-Drops",
  "waves.leaderboard.loadingEarlier": "Frühere Drops werden geladen",
  "waves.leaderboard.previousLoadError":
    "Frühere Drops konnten nicht geladen werden. Wähle „Erneut versuchen“, um den Ladevorgang zu wiederholen.",
  "waves.leaderboard.retryEarlier": "Frühere Drops erneut laden",
  "waves.leaderboard.loadingMore": "Weitere Drops werden geladen",
  "waves.leaderboard.nextLoadError":
    "Weitere Drops konnten nicht geladen werden. Wähle „Erneut versuchen“, um den Ladevorgang zu wiederholen.",
  "waves.leaderboard.retryMore": "Weitere Drops erneut laden",
  "waves.leaderboard.loadMore": "Weitere Drops laden",
  "waves.leaderboard.loadingMoreButton": "Wird geladen…",
  "waves.leaderboard.grid.untitled": "Unbenannter Drop",
  "waves.leaderboard.grid.readFull": "Vollständig lesen",
  "waves.leaderboard.grid.open": "Öffnen",
  "waves.leaderboard.grid.openNamed": "{title} öffnen",
  "waves.leaderboard.grid.authorProfile": "Profil von {author} ansehen",
  "waves.leaderboard.grid.voters.one": "{count} abstimmende Person",
  "waves.leaderboard.grid.voters.other": "{count} abstimmende Personen",
  "waves.leaderboard.grid.you": "Du",
  "waves.leaderboard.grid.votesNow": "Stimmen jetzt",
  "waves.leaderboard.grid.status.approved": "Genehmigt",
  "waves.leaderboard.grid.status.approvingIn": "Genehmigung in {time}",
  "waves.leaderboard.grid.status.reachedThreshold": "Schwellenwert erreicht",
  "waves.leaderboard.grid.status.closed": "Geschlossen",
  "waves.leaderboard.grid.status.needs": "Benötigt {amount}",
  "waves.leaderboard.grid.voteSummary.approval":
    "{reached} von {required} {unit} erreicht. Status: {status}.",
  "waves.leaderboard.grid.voteSummary.approvalWithRealtime":
    "{reached} von {required} {unit} erreicht. Stimmen jetzt: {votesNow} {unit}. Status: {status}.",
  "waves.leaderboard.grid.voteSummary.standard":
    "Aktueller Stand: {current} {unit}. Prognose: {projected} {unit}.",
  "waves.leaderboard.timeline.toggle":
    "Entscheidungszeitplan ein- oder ausblenden",
  "waves.leaderboard.timeline.decisionTimeline": "Entscheidungszeitplan",
  "waves.leaderboard.timeline.announcementHistory": "Ankündigungsverlauf",
  "waves.leaderboard.timeline.paused": "Pausiert",
  "waves.leaderboard.timeline.nextDecisionAfter":
    "Nächste Entscheidung nach dem {date}",
  "waves.leaderboard.timeline.noDecisionScheduled":
    "Keine Entscheidung geplant",
  "waves.leaderboard.timeline.noUpcomingEvents":
    "Keine bevorstehenden Ereignisse",
  "waves.leaderboard.timeline.nextWinner": "Nächster Gewinner",
  "waves.leaderboard.timeline.nextWinnerIn": "Nächster Gewinner in {countdown}",
  "waves.leaderboard.timeline.unit.day.one": "{count} Tag",
  "waves.leaderboard.timeline.unit.day.other": "{count} Tage",
  "waves.leaderboard.timeline.unit.hour.one": "{count} Stunde",
  "waves.leaderboard.timeline.unit.hour.other": "{count} Stunden",
  "waves.leaderboard.timeline.unit.minute.one": "{count} Minute",
  "waves.leaderboard.timeline.unit.minute.other": "{count} Minuten",
  "waves.leaderboard.timeline.unit.second.one": "{count} Sekunde",
  "waves.leaderboard.timeline.unit.second.other": "{count} Sekunden",
  "waves.leaderboard.timeline.status.next": "Als Nächstes",
  "waves.leaderboard.timeline.status.done": "Erledigt",
  "waves.leaderboard.timeline.status.completed": "Abgeschlossen",
  "waves.poll.actions.viewResults": "Ergebnisse anzeigen",
  "waves.poll.actions.vote": "Abstimmen",
  "waves.poll.actions.changeVote": "Stimme ändern",
  "waves.poll.status.voted": "Abgestimmt",
  "waves.poll.status.updated": "Aktualisiert",
  "theMemes.documentTitle": "The Memes | Sammlungen",
  "theMemes.description.collections": "Sammlungen",
  "theMemes.detail.live.artwork.mintDateLabel": "Mint-Datum:",
  ...DE_DE_THE_MEMES_COLLECTORS_MESSAGES,
  "theMemes.sorting.regionLabel": "Meme-Sortierung",
  "theMemes.sorting.sortBy": "Sortieren nach",
  "theMemes.sorting.directionLegend": "Sortierrichtung",
  "theMemes.sorting.ascendingLabel": "Aufsteigend sortieren",
  "theMemes.sorting.descendingLabel": "Absteigend sortieren",
  "theMemes.sorting.sortButtonLabel": "Nach {sort} sortieren",
  "theMemes.filters.triggerAriaLabel": "{filter}: {value}",
  "theMemes.filters.year.label": "Jahr",
  "theMemes.filters.year.all": "Alle Jahre",
  "theMemes.filters.year.option": "Jahr {year}",
  "theMemes.filters.season.label": "Saison",
  "theMemes.filters.season.all": "Alle Saisons",
  "theMemes.filters.season.allForYear": "Ganzes Jahr {year}",
  "theMemes.loading.fetching": "Wird geladen",
  "theMemes.empty.title": "Keine Memes gefunden",
  "theMemes.empty.description":
    "Versuche eine andere Saison oder Sortieroption.",
  "theMemes.card.linkAriaLabel": "{name}, Karte #{tokenId} ansehen",
  "theMemes.card.metric.editionSize": "Editionsgröße: {value}",
  "theMemes.card.metric.collectors": "Sammler: {value}",
  "theMemes.card.metric.unique": "Einzigartig: {value}",
  "theMemes.card.metric.uniqueExMuseum": "Einzigartig ohne Museum: {value}",
  "theMemes.card.metric.floorPrice": "Mindestpreis: {value}",
  "theMemes.card.metric.floorPriceUnavailable": "Mindestpreis: n. v.",
  "theMemes.card.metric.highestOffer": "Höchstes Angebot: {value}",
  "theMemes.card.metric.highestOfferUnavailable": "Höchstes Angebot: n. v.",
  "theMemes.card.metric.marketCap": "Marktkapitalisierung: {value}",
  "theMemes.card.metric.marketCapUnavailable": "Marktkapitalisierung: n. v.",
  "theMemes.card.metric.volume": "Volumen ({volumeType}): {value}",
  "theMemes.sort.age": "Alter",
  "theMemes.sort.editionSize": "Editionsgröße",
  "theMemes.sort.collectors": "Sammler",
  "theMemes.sort.uniquePercent": "% einzigartig",
  "theMemes.sort.uniquePercentExMuseum": "% einzigartig ohne Museum",
  "theMemes.sort.floorPrice": "Mindestpreis",
  "theMemes.sort.marketCap": "Marktkapitalisierung",
  "theMemes.sort.highestOffer": "Höchstes Angebot",
  "theMemes.volume.trigger": "Volumen",
  "theMemes.volume.triggerWithValue": "Volumen: {volumeType}",
  "theMemes.volume.24Hours": "24 Stunden",
  "theMemes.volume.7Days": "7 Tage",
  "theMemes.volume.30Days": "30 Tage",
  "theMemes.volume.allTime": "Gesamt",
  "home.mintAllowlist.label": "Deine Zuteilung",
  "home.mintAllowlist.allocationsAriaLabel":
    "Mint-Zuteilungen für die verbundene Wallet",
  "home.mintAllowlist.connectWallet":
    "Verbinde deine Wallet, um Details anzuzeigen.",
  "home.mintAllowlist.checking": "Wird geprüft…",
  "home.mintAllowlist.notPublished":
    "Verfügbar, sobald die Verteilung veröffentlicht wurde.",
  "home.mintAllowlist.notFound": "Keine für diese Wallet.",
  "home.mintAllowlist.unavailable": "Vorübergehend nicht verfügbar.",
  "home.mintAllowlist.phase.phase0": "Phase 0",
  "home.mintAllowlist.phase.phase1": "Phase 1",
  "home.mintAllowlist.phase.phase2": "Phase 2",
  "home.mintAllowlist.phase.public": "Öffentlich",
  "home.mintAllowlist.pill.airdrop": "{phase} · {airdrop}x Airdrop",
  "home.mintAllowlist.pill.allowlist": "{phase} · {allowlist}x Allowlist",
  "home.mintAllowlist.pill.mixed":
    "{phase} · {airdrop}x Airdrop · {allowlist}x Allowlist",
  ...DE_DE_TRANSFER_MESSAGES,
} satisfies Partial<Record<MessageKey, string>>;
