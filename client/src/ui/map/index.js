// src/ui/map/index.js
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

let MapComponent = {
    map: null,
    villeLayer: L.layerGroup(),
    init(candidats, lycees) {
        this.loadmap();
        this.map.addLayer(this.villeLayer);
        this.addLycees(candidats, lycees);
    },

    loadmap() {
        // Centrer la carte sur Limoges
        this.map = L.map('map').setView([45.8336, 1.2611], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);
    },

    addLycees(candidats, lycees) {
        let markersCluster = L.markerClusterGroup({
            zoomToBoundsOnClick: false
        });

        let markers = {};
        for (let cand of candidats) {
            let UAI;
            for (let annee of cand.Scolarite) {
                if (annee.UAIEtablissementorigine) {
                    UAI = annee.UAIEtablissementorigine;
                    break;
                }
            }

            let lycee = lycees.find(lycee => lycee.numero_uai === UAI);
            if (lycee) {
                if (!lycee.candidats) {
                    lycee.candidats = [];
                }
                lycee.candidats.push(cand);

                if (lycee.latitude && lycee.longitude && !markers[lycee.numero_uai]) {
                    let marker = L.marker([lycee.latitude, lycee.longitude])
                        .bindPopup(`<b>${lycee.appellation_officielle}</b><br>Nombre de candidatures: ${lycee.candidats.length}`);
                    markersCluster.addLayer(marker);
                    markers[lycee.numero_uai] = marker;
                } else if (markers[lycee.numero_uai]) {
                    markers[lycee.numero_uai].getPopup().setContent(
                        `<b>${lycee.appellation_officielle}</b><br>Nombre de candidatures: ${lycee.candidats.length}`
                    );
                }
            }
        }

        markersCluster.on('clusterclick', function (a) {
            let totalCandidatures = 0;
            a.layer.getAllChildMarkers().forEach(marker => {
                let popupContent = marker.getPopup().getContent();
                let match = popupContent.match(/Nombre de candidatures: (\d+)/);
                if (match) {
                    totalCandidatures += parseInt(match[1]);
                }
            });
            a.layer.bindPopup(`Dans cette zone, il y a ${totalCandidatures} candidatures.`).openPopup();
        });

        this.map.addLayer(markersCluster);
    }
};

export { MapComponent };
