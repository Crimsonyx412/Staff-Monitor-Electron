// check if the value is empty
const isEmpty = (value) => {
    if (value === null || value === undefined) {
        return true;
    }
    if (value.prop && value.prop.constructor === Array) {
        return value.length === 0;
    }
    else if (typeof value === 'object') {
        return Object.keys(value).length === 0 && value.constructor === Object
    }
    else if (typeof value === 'string') {
        return value.length === 0;
    }
    else if (typeof value === 'number') {
        return value === 0;
    } else if (!value) {
        return true;
    }
    return false;
}

// format number to "00:00:00"
const formatTime = (value, type = "") => {
    var sec_num = parseInt(value, 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    if (type === "h:m") {
        hours *= 1;
        minutes *= 1;
        return hours + 'h ' + minutes + 'm';
    }
    else
        return hours + ':' + minutes + ':' + seconds;
}


module.exports = {
    isEmpty,
    formatTime
}