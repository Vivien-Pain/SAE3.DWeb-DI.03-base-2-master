

let data = await fetch("./src/data/json/postal.json");
data = await data.json();

let Postal = {}

Postal.getAll = function(){ 
    return data;
}

export { Postal };