function formatDate(objectDate){
    let day = objectDate.getDate();
    let month = objectDate.getMonth() + 1;
    let year = objectDate.getFullYear();
    if (day < 10) {
        day = '0' + day;
    }
    
    if (month < 10) {
        month = `0${month}`;
    }
    return day + '-' + month + '-' + year;
}

function getWeekNumber(date) {
    // Copy the input date to avoid modifying the original date
    var copyDate = new Date(date);
    
    // Set the time to the beginning of the day
    copyDate.setHours(0, 0, 0, 0);
    
    // Get the first day of the year
    var firstDayOfYear = new Date(copyDate.getFullYear(), 0, 1);
    
    // Calculate the number of days passed since the first day of the year
    var daysPassed = Math.floor((copyDate - firstDayOfYear) / (24 * 60 * 60 * 1000)) + 1;
    
    // Calculate the week number
    var week = Math.ceil(daysPassed / 7);
    
    var firstDayOfNextYear = new Date(date.getFullYear() + 1, 0, 1);
    var daysDifference = (firstDayOfNextYear - date) / (1000 * 60 * 60 * 24);
    if(daysDifference < 7 && date.getDay() == 0){
        //Needs to be run only if date is a sunday(start day) that lies in the new year week
        return 1;
    }
    return week;
  }