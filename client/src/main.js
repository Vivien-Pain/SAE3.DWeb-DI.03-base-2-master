import { HeaderView } from "./ui/header/index.js";
import { Candidats } from "./data/data-candidats.js";
import { Lycees } from "./data/data-lycees.js";
import './index.css';
import L, { marker } from 'leaflet';
import 'leaflet/dist/leaflet.css'

let C = {};

C.init = async function(){
    V.init();
    console.log(Candidats.getAll());
    console.log(Lycees.getAll());
   

    };


let V = {
    header: document.querySelector("#header"),
    map: null
};

V.init = function(){
    V.renderHeader();
    V.loadmap();
    V.lycee();
    isValidLatLng();
    V.existingMarkers = new Set();
    V.addMarkerIfNotExists();

}

V.renderHeader= function(){
    V.header.innerHTML = HeaderView.render();
}

V.loadmap = function(){
    // Mise à jour des coordonnées pour centrer la carte sur Limoges
    V.map = L.map('map').setView([45.8336, 1.2611], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(V.map);
}


V.lycee = function(){
    Lycees.getAll().forEach(lycee => {
    
        let latitude = parseFloat(lycee.latitude);
        let longitude = parseFloat(lycee.longitude);
        if(isNaN(latitude) || isNaN (longitude)){
        return; // Skip this lycee if coordinates are invalid
          
        }


        if(lycee.latitude == "" && lycee.longitude == ""){
            console.error("Coordonnées invalides :", lycee);
        }
        else if (isValidLatLng(latitude, longitude)) {
            L.marker([latitude, longitude]).addTo(V.map);
        }
         
        
    });
}
function isValidLatLng(lat, lng) {
    return typeof lat === "number" && !isNaN(lat) && lat >= -90 && lat <= 90 &&
           typeof lng === "number" && !isNaN(lng) && lng >= -180 && lng <= 180;
}
V.existingMarkers = new Set();

V.addMarkerIfNotExists = function(lat, lng) {
    const key = `${lat},${lng}`;
    if (!V.existingMarkers.has(key)) {
        L.marker([lat, lng]).addTo(V.map);
        V.existingMarkers.add(key);
    }
};

V.lycee = function(){
    Lycees.getAll().forEach(lycee => {
        let latitude = parseFloat(lycee.latitude);
        let longitude = parseFloat(lycee.longitude);
        if (isNaN(latitude) || isNaN(longitude)) {
            return; // Skip this lycee if coordinates are invalid
        }

        if (lycee.latitude == "" && lycee.longitude == "") {
            console.error("Coordonnées invalides :", lycee);
        } else if (isValidLatLng(latitude, longitude)) {
            V.addMarkerIfNotExists(latitude, longitude);
        }
    });
};

C.init();
