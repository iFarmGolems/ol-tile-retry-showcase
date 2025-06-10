import "./style.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function handlePromise(promise) {
  return promise
    .then((result) => {
      return [undefined, result];
    })
    .catch((error) => {
      return [error, undefined];
    });
}

async function attemptTileLoad(src, retries = 3) {
  if (retries <= 0) {
    throw new Error("Max retries reached");
  }

  const ableToLoad = await fetch(src).then((response) => {
    if (response.ok) {
      return true;
    } else {
      return false;
    }
  });

  if (ableToLoad) {
    // simulacia 50% sance na uspech
    const pass = Math.random() < 0.5;

    // cely tento if/else blok je len pre simulaciu uspechu/zlyhania (z OSM zdroja sa tile stiahne vzdy)
    // jedine co osane v prod. kode je "return src"
    if (pass) {
      return src;
    } else {
      // Delay ako chcete
      await delay(1000);

      // rekurzivne volanie s mensim poctom pokusov
      return await attemptTileLoad(src, retries - 1);
    }
  } else {
    console.warn(`Tile load failed for ${src}, retrying...`);

    // Delay ako chcete
    await delay(1000);

    // rekurzivne volanie s mensim poctom pokusov
    return await attemptTileLoad(src, retries - 1);
  }
}

const xyzLayer = new TileLayer({
  source: new OSM({
    transition: 0,
    url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    tileLoadFunction: async (imageTile, src) => {
      const [err, resolvedSrc] = await handlePromise(attemptTileLoad(src, 3));

      if (err) {
        console.error("Failed to load tile:", err);
        imageTile.getImage().src = "";
        return;
      } else {
        imageTile.getImage().src = resolvedSrc;
      }
    },
  }),
});

const olMap = new Map({
  target: "map",
  layers: [xyzLayer],
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

// setTimeout(() => {
//   xyzLayer.getSource().refresh(); // Refresh the layer after 5 seconds
// }, 0);

window.xyzLayer = xyzLayer;
window.olMap = olMap;
