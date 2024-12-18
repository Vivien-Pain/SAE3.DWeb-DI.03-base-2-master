import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

let MapComponent = {
    map: null,
    villeLayer: L.layerGroup(),
    init(candidats, lycees, postalData) {
        // Trier les lycées par leur numéro UAI
        let compare = function(a, b) {
            return a.numero_uai < b.numero_uai ? -1 : a.numero_uai > b.numero_uai ? 1 : 0;
        };
        lycees.sort(compare);

        // Charger la carte et les lycées
        this.loadmap();
        this.map.addLayer(this.villeLayer);

        // Ajouter les marqueurs des candidats post-bac
        this.addPostBacMarkers(candidats, lycees, postalData);
    },

    loadmap() {
        this.map = L.map('map').setView([45.8336, 1.2611], 13); // Centrer la carte sur la France
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);
    },

    // Ajouter les marqueurs des candidats post-bac
    addPostBacMarkers(candidats, lycees, postalData) {
        let postBacLayer = L.markerClusterGroup(); // Utiliser L.markerClusterGroup pour le clustering

        let markers = {};
        for (let cand of candidats) {
            if (cand.is_dropped_out_since_more_than_year) {
                // Ajouter un marqueur sur la ville pour les candidats déscolarisés
                let codePostal = cand.code_postal;
                let departmentCode = codePostal.substring(0, 2);
                let coordinates = this.getCoordinatesFromPostalCode(departmentCode, postalData);

                if (coordinates) {
                    let marker = L.marker(coordinates).bindPopup(`<b>Ville</b><br>Candidat déscolarisé`);
                    postBacLayer.addLayer(marker);
                }
            } else {
                // Ajouter un marqueur sur le dernier lycée fréquenté
                let UAI;
                for (let annee of cand.Scolarite) {
                    if (annee.UAIEtablissementorigine) {
                        UAI = annee.UAIEtablissementorigine;
                    }
                }

                let lycee = lycees.find(lycee => lycee.numero_uai === UAI);
                if (lycee && lycee.latitude && lycee.longitude && !markers[lycee.numero_uai]) {
                    let marker = L.marker([lycee.latitude, lycee.longitude]).bindPopup(`<b>${lycee.appellation_officielle}</b><br>Candidat Post-Bac`);
                    postBacLayer.addLayer(marker);
                    markers[lycee.numero_uai] = marker;
                }
            }
        }

        // Ajouter le groupe de marqueurs à la carte
        this.map.addLayer(postBacLayer);

        // Ajouter un popup pour afficher le nombre total de marqueurs
        postBacLayer.on('clusterclick', function (a) {
            a.originalEvent.preventDefault(); // Empêcher le zoom par défaut
            let clusterMarkers = a.layer.getAllChildMarkers();
            let totalMarkers = clusterMarkers.length;
            let popup = L.popup()
                .setLatLng(a.latlng)
                .setContent(`Total markers in cluster: ${totalMarkers}`)
                .openOn(this.map);
        }.bind(this));
    },

    // Fonction pour obtenir les coordonnées de la ville principale du département
    getCoordinatesFromPostalCode(departmentCode, postalData) {
        // Chercher la ville principale pour ce département
        let mainCityEntry = postalData.find(entry => entry.code_postal.startsWith(departmentCode) && entry.is_main_city);
        if (mainCityEntry) {
            return mainCityEntry._geopoint.split(',').map(coord => parseFloat(coord.trim()));
        }
        return null;
    }
};

export { MapComponent };
