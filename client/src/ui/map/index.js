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

        candidats.shift();

        let compare = function(a, b) {
            return a.numero_uai < b.numero_uai ? -1 : a.numero_uai > b.numero_uai ? 1 : 0;
        };
        lycees.sort(compare);

        this.loadmap();
        this.map.addLayer(this.villeLayer);
        this.addLycees(candidats, lycees);
    },

    loadmap() {
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
                        .bindPopup(this.createPopupContent(lycee));
                    markersCluster.addLayer(marker);
                    markers[lycee.numero_uai] = marker;
                } else if (markers[lycee.numero_uai]) {
                    markers[lycee.numero_uai].getPopup().setContent(
                        this.createPopupContent(lycee)
                    );
                }
            }
        }
        markersCluster.on('clusterclick', function (a) {
            let totalCandidatures = 0;
            let formations = {
            general: 0,
            sti2d: 0,
            autre: 0
            };
    
            a.propagatedFrom.getAllChildMarkers().forEach(marker => {
            let popupContent = marker.getPopup().getContent();
            let match = popupContent.match(/Nombre de candidatures: (\d+)/);
            if (match) {
                totalCandidatures += parseInt(match[1]);
            }
    
            let generalMatch = popupContent.match(/Générale: (\d+)/);
            if (generalMatch) {
                formations.general += parseInt(generalMatch[1]);
            }
    
            let sti2dMatch = popupContent.match(/STI2D: (\d+)/);
            if (sti2dMatch) {
                formations.sti2d += parseInt(sti2dMatch[1]);
            }
    
            let autreMatch = popupContent.match(/Autre: (\d+)/);
            if (autreMatch) {
                formations.autre += parseInt(autreMatch[1]);
            }
            });
    
            a.propagatedFrom.bindPopup(`Dans cette zone, il y a ${totalCandidatures} candidatures<br>
                        Générale: ${formations.general}<br>
                        STI2D: ${formations.sti2d}<br>
                        Autre: ${formations.autre}`).openPopup();
        });
     

        this.map.addLayer(markersCluster);
    },
    
    createPopupContent(lycee) {
        let general = 0, sti2d = 0, autre = 0;
        for (let cand of lycee.candidats) {
            console.log(cand.Baccalaureat.SerieDiplomeCode);
            switch (cand.Baccalaureat.SerieDiplomeCode) {
                case 'Générale':
                    general++;
                    break;
                case 'STI2D':
                    sti2d++;
                    break;
                default:
                    autre++;
                    break;
            }
        }
        return `<b>${lycee.appellation_officielle}</b><br>
                Nombre de candidatures: ${lycee.candidats.length}<br>
                Générale: ${general}<br>
                STI2D: ${sti2d}<br>
                Autre: ${autre}`;
    }
};

export { MapComponent };
