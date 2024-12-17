import { HeaderView } from "./ui/header/index.js";
import { Candidats } from "./data/data-candidats.js";
import { Lycees } from "./data/data-lycees.js";
import './index.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

let C = {};

C.init = async function(){
    V.init();
    console.log(Candidats.getAll());
    console.log(Lycees.getAll());
};

let V = {
    header: document.querySelector("#header"),
    map: null,
    villeLayer: L.layerGroup()
};

V.init = function(){
    V.loadmap();
    V.map.addLayer(V.villeLayer);
    V.lycée();
}

V.renderHeader = function(){
    V.header.innerHTML = HeaderView.render();
}

V.loadmap = function() {
    // Centrer la carte sur Limoges
    V.map = L.map('map').setView([45.8336, 1.2611], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(V.map);
}

V.lycée = function() {
    let candidats = Candidats.getAll();
    let lycees = Lycees.getAll();

    // Créer une instance de MarkerClusterGroup avec l'option zoomToBoundsOnClick désactivée
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

    V.map.addLayer(markersCluster);
};

C.init();
