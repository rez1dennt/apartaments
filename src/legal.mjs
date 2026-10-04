import { site } from './content.mjs';

const operator = `<strong>${site.operator}</strong><br>${site.operatorAddress}<br>${site.register}`;
const phone = `<a href="tel:${site.telephoneLink}">${site.telephone}</a>`;
export const legal = {
  de: {
    datenschutz: {
      title: 'Datenschutzerklärung', subtitle: 'Ihre Daten verdienen einen klaren Umgang.',
      sections: [
        ['1. Verantwortlicher und Kontakt', `${operator}<p>Für Anliegen zum Datenschutz erreichen Sie uns telefonisch unter ${phone} oder schriftlich an der oben genannten Anschrift. Die endgültige Datenschutz-E-Mail-Adresse und der Hostinganbieter sind vor Aktivierung der Online-Anfrage zu ergänzen.</p>`],
        ['2. Bearbeitung von Online-Anfragen', 'Beim Absenden werden Ihre Angaben geprüft und über die Server-Mailfunktion zur Bearbeitung an Vp@simplyfood.de adressiert. Verarbeitet werden Name, E-Mail-Adresse und, soweit angegeben, Telefonnummer, Reisezeitraum, gewünschtes Apartment und Nachricht. Das Absenden bestätigt noch keine Reservierung.'],
        ['3. Aufruf der Website', 'Beim Abruf einer Website werden technisch unter anderem IP-Adresse, Zeitpunkt, aufgerufene URL, Browserinformationen und Antwortstatus an den Hostinganbieter übermittelt. Ob und wie lange dieser Zugriffsdaten protokolliert, hängt von der noch festzulegenden Hostingkonfiguration ab. Anbieter, Standort, Rechtsgrundlage, Zugriff und konkrete Löschfristen müssen vor Veröffentlichung dokumentiert werden. Es sind derzeit keine Analyse-, Werbe- oder Profilingdienste eingebunden.'],
        ['4. Online-Anfragen nach Aktivierung', 'Die spätere Online-Anfrage erfasst Name, E-Mail-Adresse und die gesonderte Einwilligung. Telefon, Reisedaten, gewünschtes Apartment und Nachricht sind freiwillig. Zweck ist ausschließlich die Bearbeitung Ihrer Anfrage und die Kommunikation über Preis, Verfügbarkeit und Ihren möglichen Aufenthalt. Keine Newsletter-Anmeldung und keine Weitergabe zu Werbezwecken. Für die einwilligungsbasierte Anfrage gilt Art. 6 Abs. 1 lit. a DSGVO; erforderliche vorvertragliche Verarbeitung kann auf Art. 6 Abs. 1 lit. b DSGVO beruhen. Eine Anfrage ist keine Reservierungsbestätigung.'],
        ['5. Sicherheitsfunktionen der Anfrage', 'Erst bei aktivierter Online-Anfrage wird eine kurzlebige, technisch notwendige Sitzung für einen Sicherheitstoken eingerichtet. Sie verwendet ein HttpOnly-Sitzungscookie und bei HTTPS das Secure-Attribut. Die Sitzung läuft nach spätestens 30 Minuten ab. Zur Begrenzung missbräuchlicher Anfragen werden zeitlich begrenzte Zähler mit einem geheimnisbasierten IP-Hash verwendet; die IP-Adresse wird dabei nicht im Klartext abgelegt. Rechtsgrundlage für erforderliche Schutzmaßnahmen ist Art. 6 Abs. 1 lit. f DSGVO, soweit anwendbar.'],
        ['6. Empfänger, Speicherfristen und Übermittlungen', 'Bei Aktivierung werden Anfragen über die vom Betreiber eingerichtete Server-Mailfunktion an sein bestätigtes Postfach weitergeleitet. Hosting- und E-Mail-Anbieter, gegebenenfalls weitere Auftragsverarbeiter, Vertragsgrundlagen, Speicherorte und konkrete Aufbewahrungsfristen sind vor Aktivierung zu benennen. Daten sind zu löschen, sobald der Anfragezweck entfällt und keine gesetzliche Pflicht oder andere gültige Rechtsgrundlage fortbesteht. Das Formular legt keine Anfrage-Datenbank an. Nachrichten werden durch die eingesetzte Mail-Infrastruktur verarbeitet. Eine Drittlandübermittlung wird durch diese Vorschau nicht eingerichtet; die tatsächliche Infrastruktur ist vor dem Livebetrieb auf Art. 44 ff. DSGVO zu prüfen.'],
        ['7. Lokale Einstellungen, Schriftarten und Karten', 'Schriftarten und Fotos liegen auf dem eigenen Webserver. Es gibt keine eingebettete externe Karte. Wenn Sie „Route planen“ wählen, öffnet sich Google Maps auf einer externen Website; dort gelten die Bedingungen des Anbieters. Ihre Auswahl zum Datenschutzhinweis wird lokal im Browser gespeichert, maximal 180 Tage. Einzelheiten finden Sie in den Cookie-Hinweisen.'],
        ['8. Ihre Rechte', 'Soweit die gesetzlichen Voraussetzungen vorliegen, haben Sie das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch nach Art. 15–21 DSGVO. Eine Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen; die bisherige Verarbeitung bleibt davon unberührt. Sie können sich bei einer Datenschutzaufsichtsbehörde beschweren, insbesondere beim Hamburgischen Beauftragten für Datenschutz und Informationsfreiheit. Es gibt keine ausschließlich automatisierte Entscheidung mit rechtlicher Wirkung.'],
        ['9. Stand und Freigabe', 'Stand: 1. Oktober 2026. Diese Fassung beschreibt die Vorschau und die vorgesehene Anfragetechnik. Vor Livebetrieb sind insbesondere die tatsächliche Infrastruktur, Datenschutzkontakte, Empfänger und Löschfristen durch den Betreiber zu ergänzen und freizugeben.']
      ]
    },
    einwilligung: {
      title: 'Einwilligung zur Anfrage', subtitle: 'Gesondert, freiwillig und nur für Ihre Anfrage.',
      sections: [
        ['Verantwortlicher', operator],
        ['Zweck und Daten', 'Ich willige freiwillig ein, dass Agat Management GmbH meinen Namen und meine E-Mail-Adresse sowie die von mir freiwillig angegebenen Telefonnummer, Reisedaten, Apartmentauswahl und Nachrichteninhalte verarbeitet, um meine Aufenthaltsanfrage zu beantworten. Die Einwilligung umfasst keine Werbung, keinen Newsletter und keine öffentliche Verbreitung meiner Angaben.'],
        ['Verarbeitung und Empfänger', 'Die Verarbeitung umfasst Erheben, Erfassen, Speichern, Ordnen, Abrufen, Verwenden, gegebenenfalls Weiterleiten an vertraglich eingebundene Hosting- und E-Mail-Dienstleister sowie Löschen, soweit dies für die Anfrage erforderlich ist. Die tatsächlichen Empfänger, Speicherorte und Löschfristen müssen in der Datenschutzerklärung vor Aktivierung der Anfrage ergänzt werden.'],
        ['Dauer und Widerruf', `Die Einwilligung gilt bis zum Abschluss des Anfragezwecks oder meinem vorherigen Widerruf. Ohne andere gültige Rechtsgrundlage werden die Daten danach gelöscht. Ich kann meine Einwilligung über ${phone} oder schriftlich an die Anschrift des Verantwortlichen widerrufen. Die Rechtmäßigkeit bis zum Widerruf bleibt unberührt. Gesetzliche Aufbewahrungspflichten können eine weitere Speicherung erfordern.`],
        ['Wie ich zustimme', 'Die Zustimmung erfolgt durch eine eigene, nicht vorangekreuzte Checkbox im Anfrageformular und die anschließende bewusste Übermittlung. Ohne diese Zustimmung wird die einwilligungsbasierte Anfrage nicht versendet; der Telefonkontakt bleibt möglich. Beim Absenden werden die Angaben zur Bearbeitung der Anfrage an den Server übertragen. Fassung: 1. Oktober 2026.']
      ]
    },
    impressum: {
      title: 'Impressum', subtitle: 'Bergedorf Apartments · Betreiberangaben',
      sections: [
        ['Diensteanbieter', operator],
        ['Apartmentadresse', `${site.name}<br>${site.address}<br>${site.postal}`],
        ['Kontakt', `${phone}<p>Telefonisch 9:00–17:00 Uhr. Online-Anfragen können über das Anfrageformular gesendet werden. E-Mail: <a href="mailto:${site.email}">${site.email}</a>.</p>`],
        ['Register', 'Handelsregister: Amtsgericht Hamburg, HRB 140484. Diese Angaben wurden vom Auftraggeber bereitgestellt.'],
        ['Vor Veröffentlichung zu ergänzen', 'Vertretungsberechtigte Person, erreichbare geschäftliche E-Mail-Adresse und gegebenenfalls Umsatzsteuer-Identifikationsnummer sowie weitere tatsächlich erforderliche Angaben nach § 5 DDG. Diese Vorschaufassung ist kein vollständig freigegebenes Impressum.'],
        ['Reservierungen', 'Die Nutzung der Apartments ist ausschließlich nach vorheriger bestätigter Reservierung möglich. Eine Kontaktanfrage stellt noch keine Buchung oder Reservierungsbestätigung dar.']
      ]
    },
    cookies: {
      title: 'Cookie-Hinweise', subtitle: 'Weniger Tracking. Mehr Privatsphäre.',
      sections: [
        ['Keine Analyse und keine Werbung', 'Die Website verwendet keine Analyse-, Marketing- oder Tracking-Cookies. Es sind keine Trackingpixel, Social-Media-Widgets oder eingebetteten externen Karten eingerichtet. Schriftarten und Fotografien werden lokal geladen.'],
        ['Lokale Einstellung: ba-privacy-v1', 'Im localStorage des Browsers speichern wir ausschließlich Ihre Bestätigung dieses Datenschutzhinweises, die Version und den Zeitpunkt. Diese lokale Einstellung wird nicht an den Betreiber übertragen und bei einem Besuch nach 180 Tagen verworfen. „Verstanden“ und „Nur notwendige“ aktivieren dieselben ausschließlich notwendigen Funktionen. Sie können den Hinweis über „Cookie-Einstellungen“ erneut öffnen oder die Website-Daten in Ihrem Browser löschen.'],
        ['Anfragesitzung nach Aktivierung', 'Bei einer aktivierten Online-Anfrage verwendet die API das technisch notwendige Sitzungscookie BA_SESSION für einen Schutz gegen fremde Formulareinsendungen. Es wird erst bei Nutzung der aktiven Anfragefunktion gesetzt, ist nicht für Werbung bestimmt und die serverseitige Sitzung läuft nach 30 Minuten ab. Die WordPress-Form verwendet das technisch notwendige Cookie ba_inquiry; die eigenständige PHP-Version verwendet BA_SESSION. Die Gültigkeit beträgt 30 Minuten.'],
        ['Rechtsgrundlage und externe Links', 'Technisch erforderlicher Zugriff auf Endeinrichtungen kann unter die Ausnahme des § 25 Abs. 2 TDDDG fallen; soweit dabei personenbezogene Daten verarbeitet werden, ist zusätzlich eine Rechtsgrundlage nach der DSGVO erforderlich. Externe Karten öffnen erst nach Ihrem ausdrücklichen Klick als externe Website. Die Website lädt auch bei Ablehnung keine optionalen Dienste.']
      ]
    }
  },
};

export const legalSlugs = { de: ['impressum', 'datenschutz', 'einwilligung', 'cookies'] };
