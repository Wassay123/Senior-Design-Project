// Generate CSS styles for custom map markers based on specified color.
const markerHtmlStyles = (color) => `
    background-color: ${color};
    width: 1rem;
    height: 1rem;
    display: block;
    left: -1.5rem;
    top: -1.5rem;
    position: relative;
    border-radius: 3rem 3rem 0;
    transform: rotate(45deg);
    border: 1px solid #FFFFFF`;

// Generate CSS styles for custom city icons based on specified color, slightly larger than regular markers.
const cityHtmlStyles = (color) => `
    background-color: ${color};
    width: 2rem;
    height: 2rem;
    display: block;
    left: -1.5rem;
    position: relative;
    border-radius: 3rem 3rem 0;
    transform: rotate(45deg);
    border: 1px solid #FFFFFF`;

// Create a custom green icon for representing safe agents on the map.
const greenIcon = L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles('green')}"></span>`
});

// Create a custom blue icon for city markers.
const blueIcon = L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${cityHtmlStyles('blue')}"></span>`
});

// Create a custom red icon for representing infected agents.
const redIcon = L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles('red')}"></span>`
});

// Create a custom grey icon for representing deceased agents.
const greyIcon = L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles('grey')}"></span>`
});

// Create a custom black icon for representing critically affected agents or special areas.
const blackIcon = L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles('black')}"></span>`
});

// Create a custom icon for representing the tornado itself on the map.
const tornadoIcon = L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${cityHtmlStyles('black')}"></span>`
});

// Function to retrieve the appropriate custom icon based on the given color.
function getIconByColor(color) {
    switch (color) {
        case 'green': return greenIcon;
        case 'red': return redIcon;
        case 'grey': return greyIcon;
        case 'black': return blackIcon;
        case 'blue': return blueIcon;
        case 'tornado': return tornadoIcon;
        default: return null; // Return null if no valid color is provided.
    }
}

// Function to retrieve the appropriate custom icon based on the agent's state.
function getIconByAgentState(state) {
    switch (state) {
        case 0: // SAFE
            return greenIcon;
        case 1: // INFECTED
            return redIcon;
        case 2: // DEAD
            return greyIcon;
        case 3: // CRITICAL or other defined state
            return blackIcon;
        default:
            return greenIcon; // Default to safe icon if state is undefined or unknown.
    }
}
