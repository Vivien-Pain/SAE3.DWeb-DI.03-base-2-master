import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

let MapComponent = {
    map: null,
    villeLayer: L.layerGroup(),
    markersCluster: L.markerClusterGroup({ zoomToBoundsOnClick: false }),
    postbacCluster: L.markerClusterGroup({ zoomToBoundsOnClick: false }),

    init(candidats, lycees, postal) {
        lycees.sort((a, b) => a.numero_uai.localeCompare(b.numero_uai));

        this.loadMap();
        this.villeLayer.clearLayers();
        this.map.addLayer(this.villeLayer);
        this.markersCluster.clearLayers();
        this.postbacCluster.clearLayers();

        this.addLycees(candidats, lycees);  // Ajouter les lycées à la carte
        this.addPostbacMarkers(candidats, lycees, postal);  // Ajouter les marqueurs postbac
        this.addPostbacCluster();  // Gérer le cluster des marqueurs postbac

        this.map.addLayer(this.markersCluster);
    },

    loadMap() {
        this.map = L.map('map').setView([45.8336, 1.2611], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);
    },

    // Ajout des lycées à la carte
    addLycees(candidats, lycees) {
        let markers = {};

        for (let cand of candidats) {
            let UAI;
            for (let annee of cand.Scolarite) {
                if (annee.UAIEtablissementorigine) {
                    UAI = annee.UAIEtablissementorigine;
                    break;
                }
            }

            let lycee = lycees.find(l => l.numero_uai === UAI);
            if (lycee) {
                if (!lycee.candidats) {
                    lycee.candidats = [];
                }
                lycee.candidats.push(cand);

                if (lycee.latitude && lycee.longitude && !markers[lycee.numero_uai]) {
                    let marker = L.marker([lycee.latitude, lycee.longitude])
                        .bindPopup(this.createPopupContent(lycee));
                    this.markersCluster.addLayer(marker);
                    markers[lycee.numero_uai] = marker;
                } else if (markers[lycee.numero_uai]) {
                    markers[lycee.numero_uai].getPopup().setContent(
                        this.createPopupContent(lycee)
                    );
                }
            }
        }

        this.markersCluster.on('clusterclick', function (a) {
            let totalCandidatures = 0;
            let formations = { general: 0, sti2d: 0, autre: 0 };

            a.propagatedFrom.getAllChildMarkers().forEach(marker => {
                let popupContent = marker.getPopup().getContent();
                let match = popupContent.match(/Nombre de candidatures: (\d+)/);
                if (match) totalCandidatures += parseInt(match[1]);

                let generalMatch = popupContent.match(/Générale: (\d+)/);
                if (generalMatch) formations.general += parseInt(generalMatch[1]);

                let sti2dMatch = popupContent.match(/STI2D: (\d+)/);
                if (sti2dMatch) formations.sti2d += parseInt(sti2dMatch[1]);

                let autreMatch = popupContent.match(/Autre: (\d+)/);
                if (autreMatch) formations.autre += parseInt(autreMatch[1]);
            });

            a.propagatedFrom.bindPopup(`Dans cette zone, il y a ${totalCandidatures} candidatures<br>
                Générale: ${formations.general}<br>
                STI2D: ${formations.sti2d}<br>
                Autre: ${formations.autre}`).openPopup();
        });
    },

    // Créer le contenu du popup pour chaque lycée
    createPopupContent(lycee) {
        let general = 0, sti2d = 0, autre = 0;
        for (let cand of lycee.candidats) {
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
    },

    // Ajouter des marqueurs pour les zones postbac
    addPostbacMarkers(candidats, lycees, postal) {
        let postbacIndex = {};

        for (let cand of candidats) {
            let UAI = cand.Scolarite.find(annee => annee.UAIEtablissementorigine)?.UAIEtablissementorigine;
            let lycee = lycees.find(lycee => lycee.numero_uai === UAI);
            if (!lycee) {
                let cp = cand.Scolarite[0]?.CommuneEtablissementOrigineCodePostal;
                if (cp) {
                    let villeCode = cp.slice(0, 2) + '000';
                    let villeData = postal.find(ville => ville.code_postal === villeCode);
                    if (villeData) {
                        postbacIndex[villeCode] = postbacIndex[villeCode] || { candidats: [], ville: villeData };
                        postbacIndex[villeCode].candidats.push(cand);
                    }
                }
            }
        }

        for (let villeCode in postbacIndex) {
            let villeData = postbacIndex[villeCode];
            if (villeData.ville?._geopoint) {
                let [lat, lng] = villeData.ville._geopoint.split(',');
                let general = 0, sti2d = 0, autre = 0;
                for (let cand of villeData.candidats) {
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
                let marker = L.marker([lat, lng])
                    .bindPopup(`<b>${villeData.ville.nom_de_la_commune}</b><br>
                        Nombre de candidatures postbac: ${villeData.candidats.length}<br>
                        Générale: ${general}<br>
                        STI2D: ${sti2d}<br>
                        Autre: ${autre}`);
                this.postbacCluster.addLayer(marker);
            }
        }
    },

    // Ajouter des clusters pour les zones postbac
    addPostbacCluster() {
        this.postbacCluster.on('clusterclick', function (a) {
            let totalCandidatures = 0;
            let formations = { general: 0, sti2d: 0, autre: 0 };

            a.propagatedFrom.getAllChildMarkers().forEach(marker => {
                let popupContent = marker.getPopup().getContent();
                let match = popupContent.match(/Nombre de candidatures postbac: (\d+)/);
                if (match) totalCandidatures += parseInt(match[1]);

                let generalMatch = popupContent.match(/Générale: (\d+)/);
                if (generalMatch) formations.general += parseInt(generalMatch[1]);

                let sti2dMatch = popupContent.match(/STI2D: (\d+)/);
                if (sti2dMatch) formations.sti2d += parseInt(sti2dMatch[1]);

                let autreMatch = popupContent.match(/Autre: (\d+)/);
                if (autreMatch) formations.autre += parseInt(autreMatch[1]);
            });

            a.propagatedFrom.bindPopup(`Dans cette zone, il y a ${totalCandidatures} candidatures postbac<br>
                Générale: ${formations.general}<br>
                STI2D: ${formations.sti2d}<br>
                Autre: ${formations.autre}`).openPopup();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('show-neo-bachelier').addEventListener('click', () => {
        MapComponent.map.eachLayer(layer => {
            if (layer instanceof L.MarkerClusterGroup || layer === MapComponent.villeLayer) {
                MapComponent.map.removeLayer(layer);
            }
        });
        MapComponent.map.addLayer(MapComponent.markersCluster);
    });

    document.getElementById('show-post-bac').addEventListener('click', () => {
        MapComponent.map.eachLayer(layer => {
            if (layer instanceof L.MarkerClusterGroup || layer === MapComponent.markersCluster) {
                MapComponent.map.removeLayer(layer);
            }
        });
        MapComponent.map.addLayer(MapComponent.postbacCluster);
    });

    document.getElementById('show-all').addEventListener('click', () => {
        MapComponent.map.eachLayer(layer => {
            if (layer instanceof L.MarkerClusterGroup || layer === MapComponent.villeLayer || layer === MapComponent.markersCluster) {
                MapComponent.map.removeLayer(layer);
            }
        });
        MapComponent.map.addLayer(MapComponent.markersCluster);
        MapComponent.map.addLayer(MapComponent.postbacCluster);
    });
});

export { MapComponent };
