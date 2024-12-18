import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

let MapComponent = {
    map: null,
    villeLayer: L.layerGroup(),

    init(candidats, lycees, postal) {
        candidats.shift(); // Suppression du premier élément si nécessaire

        let compare = function(a, b) {
            return a.numero_uai < b.numero_uai ? -1 : a.numero_uai > b.numero_uai ? 1 : 0;
        };
        lycees.sort(compare);

        this.loadmap();
        this.map.addLayer(this.villeLayer);
        this.addLycees(candidats, lycees);
        this.addPostbacMarkers(candidats, lycees, postal);
        this.addPostbacCluster();
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
                    let marker = L.marker([lycee.latitude, lycee.longitude], { lycee: lycee })
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
                let { candidats } = marker.options.lycee;
                totalCandidatures += candidats.length;

                candidats.forEach(cand => {
                    switch (cand.Baccalaureat.SerieDiplomeCode) {
                        case 'Générale':
                            formations.general++;
                            break;
                        case 'STI2D':
                            formations.sti2d++;
                            break;
                        default:
                            formations.autre++;
                            break;
                    }
                });
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

    addPostbacMarkers(candidats, lycees, postal) {
        let postbacIndex = {};

        for (let cand of candidats) {
            let UAI;
            for (let annee of cand.Scolarite) {
                if (annee.UAIEtablissementorigine) {
                    UAI = annee.UAIEtablissementorigine;
                    break;
                }
            }

            let lycee = lycees.find(lycee => lycee.numero_uai === UAI);
            if (!lycee) {
                let cp = cand.Scolarite[0] ? cand.Scolarite[0].CommuneEtablissementOrigineCodePostal : null;

                if (cp) {
                    let villeCode = cp.slice(0, 2) + '000';
                    let villeData = postal.find(ville => ville.code_postal === villeCode); // Recherche la ville via le code postal

                    if (villeData) {
                        if (!postbacIndex[villeCode]) {
                            postbacIndex[villeCode] = {
                                candidats: [],
                                ville: villeData
                            };
                        }
                        postbacIndex[villeCode].candidats.push(cand);
                    }
                }
            }
        }

        for (let villeCode in postbacIndex) {
            let villeData = postbacIndex[villeCode];
            if (villeData.ville !== null) {
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

                if (villeData.ville._geopoint) {
                    let [lat, lng] = villeData.ville._geopoint.split(',');
                    let marker = L.marker([lat, lng])
                        .bindPopup(`<b>${villeData.ville.nom_de_la_commune}</b><br>
                            Nombre de candidatures postbac: ${villeData.candidats.length}<br>
                            Générale: ${general}<br>
                            STI2D: ${sti2d}<br>
                            Autre: ${autre}`);
                    this.villeLayer.addLayer(marker);
                }
            }
        }

        console.log(postbacIndex); // Log le postbacIndex pour vérifier que les candidats sont bien associés aux villes
    },

    addPostbacCluster() {
        let postbacCluster = L.markerClusterGroup({
            zoomToBoundsOnClick: false
        });

        this.villeLayer.eachLayer(layer => {
            postbacCluster.addLayer(layer);
        });

        postbacCluster.on('clusterclick', function (a) {
            let totalCandidatures = 0;
            let formations = {
                general: 0,
                sti2d: 0,
                autre: 0
            };

            a.propagatedFrom.getAllChildMarkers().forEach(marker => {
                let popupContent = marker.getPopup().getContent();
                let matches = popupContent.match(/Générale: (\d+)<br>STI2D: (\d+)<br>Autre: (\d+)/);
                if (matches) {
                    totalCandidatures += parseInt(matches[1]) + parseInt(matches[2]) + parseInt(matches[3]);
                    formations.general += parseInt(matches[1]);
                    formations.sti2d += parseInt(matches[2]);
                    formations.autre += parseInt(matches[3]);
                }
            });

            a.propagatedFrom.bindPopup(`Dans cette zone, il y a ${totalCandidatures} candidatures postbac<br>
                Générale: ${formations.general}<br>
                STI2D: ${formations.sti2d}<br>
                Autre: ${formations.autre}`).openPopup();
        });

        this.map.addLayer(postbacCluster);
    }
};

export { MapComponent };
