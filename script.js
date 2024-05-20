
const projectFilterContainer = document.querySelector('.projectFilterContainer'),
projectButton = document.querySelector('.projectButton'),
options = document.querySelector('.js_options'),
search = document.querySelector('.js_search input');
let startDateElement = document.querySelector('.startDate .value'),
startWeekCode = document.querySelector('.startWeekCode .value'),
endDateElement = document.querySelector('.endDate .value'),
endWeekCode = document.querySelector('.endWeekCode .value');
topPerformer = document.querySelector('.topPerformer'),
performancelistContainer = document.querySelector('.performerslist'),
performerslist = document.querySelector('.performerslist > ul'),
totalScore = document.querySelector('.projectToalScore'),
efficiency = document.querySelector('.efficiency'),
quality = document.querySelector('.quality'),
productivity = document.querySelector('.productivity'),
attendance = document.querySelector('.attendance');
const bodyLoader = document.querySelector('.bodyLoader'),
containerSection = document.querySelector('.containerSection'),
containerLoader = document.querySelector('.containerLoader'),
paginationContainer = document.querySelector('.paginationContainer');
body = document.querySelector('body'),
zohoinit = ZOHO.CREATOR.init(),
zohoapi = ZOHO.CREATOR.API,
zohoutil = ZOHO.CREATOR.UTIL;
let projects;
let responsesMap = new Map();

const colorMap = new Map([
    ['Platinum', '#CECECE'],
    ['Diamond', '#b9f2ff'],
    ['Gold', '#FFD700'],
    ['Silver', '#e6e6e6'],
    ['Disqualified', '#f46770']
]);


loadDashboard();
async function loadDashboard(){
   await zohoinit;
   let projectsConfig = {
    reportName : "All_Projects"
    }
   projects = await zohoapi.getAllRecords(projectsConfig);
   projects = projects.data;
   let li = "";
   projects.forEach(project => {
    li += `<li onclick="updateProject(this)" selected="false" data-project="${project.ID}">${project.Project_Name}</li>`;
    })
    options.insertAdjacentHTML("beforeend",li);
    prefillData();
}

projectButton.addEventListener('click', ()=>{
    projectFilterContainer.classList.toggle('active');
});



function updateProject(selectedLi){
    projectFilterContainer.classList.remove('active');
    selectedLi.setAttribute('selected','true');
    projectButton.firstElementChild.innerText = selectedLi.innerText;
}


search.addEventListener('keyup', ()=>{
    let searchValue = search.value.trim().toLowerCase();
    let searchResults = projects.filter(project => {
        return project.Project_Name.trim().toLowerCase().startsWith(searchValue);
    }).map(project => `<li onclick="updateProject(this)" selected="false" data-project="${project.ID}">${project.Project_Name}</li>`).join("");

    options.innerHTML = searchResults;
})

/**** Month Picker ****/
$('.monthFilter').datepicker({
    autoclose: true,
    minViewMode: 1,
    format: 'mm/yyyy',
    endDate: new Date() // Set end date to today
}).on('changeDate', function(selected){
        startDate = new Date(selected.date.valueOf());
        startDate.setDate(startDate.getDate(new Date(selected.date.valueOf())));
        $('.to').datepicker('setStartDate', startDate);
    }); 

var defaultDate = new Date();
// Set the current date to the first day of the current month
defaultDate.setDate(1);
$('.monthFilter').datepicker('setDate', defaultDate);

 function prefillData(){
        options.querySelector("li").setAttribute('selected','true');
        updateProject(options.querySelector("li"));
        showData();
}

function getEndOfMonth(startDate) {
        // Create a new Date object from the provided start date
        const endDate = new Date(startDate);
      
        // Set the date to the last day of the month
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      
        return endDate;
}

 let startCode,endCode;
function showData(){
    containerSection.classList.add("loading");
    let startDate = $('.monthFilter').datepicker('getDate');
    let endDate = getEndOfMonth(startDate);
    let endingWeek;
    // Adjust startDate if it's not a Sunday
    if (startDate.getDay() !== 0) {
        startDate.setDate(startDate.getDate() - startDate.getDay());
    } 

    // Adjust endDate if it's not a Saturday
    if (endDate.getDay() !== 6) {
            endDate.setDate(endDate.getDate() - (endDate.getDay() + 1 || 7));
    }
    endingWeek = getWeekNumber(endDate);
    let startingWeek = getWeekNumber(startDate);

    // Adjust the year if it's a previous year's date falling in the first week of the new year
    let adjustedYear = (startingWeek == 1 && startDate.getMonth() == 11? startDate.getFullYear() + 1: startDate.getFullYear());

    startDateElement.innerText = formatDate(startDate);
    endDateElement.innerText = formatDate(endDate);
    startCode = adjustedYear+ "W" + (startingWeek < 10?"0"+startingWeek:startingWeek);
    endCode = endDate.getFullYear()+ "W" + (endingWeek < 10?"0"+endingWeek:endingWeek);
    startWeekCode.innerText = startCode;
    endWeekCode.innerText = endCode;
    fetchData(startCode, endCode,document.querySelector(`li[selected="true"]`).getAttribute("data-project"));
    document.querySelector(".appliedFilters").classList.add("expand");
}

totalRecordCount = null;
totalPages = null;
let activePage = 1,stackArray;
async function fetchData(startWeekCode, endWeekCode, projectID){
    if(responsesMap.get(activePage) == null){
            if(totalRecordCount == null){
                let recCountConfig = {
                    reportName: "All_Incentives",
                    criteria: `(Week_Number >= ${startWeekCode.replace(/[A-Za-z]/g, '')} && Week_Number <= ${endWeekCode.replace(/[A-Za-z]/g, '')} && Project == ${projectID})`
                }
                countResp = await zohoapi.getRecordCount(recCountConfig);
                totalRecordCount = Number(countResp.result.records_count);
                totalPages = (totalRecordCount % 10 == 0)?(Math.floor(totalRecordCount/10)):Math.floor(totalRecordCount/10) + 1;
            }

            let formData = {"data":{"Page_Number":""+activePage+"","Role":"Manager","Project":""+projectID+"","Start_Week_Code":""+startWeekCode+"","End_Week_Code":""+endWeekCode+""},"result": {"fields":["Response"]}};
            let config = {"formName":"Widget_Response","data":formData};
            response = await zohoapi.addRecord(config);
            console.log(response);
            response = await response.data.Response;
            console.log(response);
            response = await JSON.parse(response);
            responsesMap.set(activePage,response);
        }
        else{
            response = responsesMap.get(activePage);
        }
        allPerformances(response.performance);
        loadSideBar(response);
        // if(activePage == 1){
        //   stackArray = response.stack_codes_graph.map(stack => stack.count);
        // }
        loadChart(response.performance);
        body.classList.remove('loading');
        bodyLoader.style.display = "none";
        containerSection.classList.remove("loading");
        performancelistContainer.scrollTop = 0;
}

let pagination = '';
function allPerformances(performances){
    let html = '';
    performances.forEach(agent =>{
        html += `<li data-rank="${agent.rank}">
        <div class="rank">${agent.rank}</div>
        <div class="profilePhoto">
          <div class="image-previewer">
            <img data-id="${agent.ID}" src="${agent.Photo}"/>
          </div>
        </div>
        <div class="PercentileprogressBar">
          <div style="width:90%;">
            <div class="name">${agent.name}</div>
          </div>
          <div class="progressContainer">
              <div class="progressBar"  style="--percentile: ${agent.percentile};"></div>
          </div>
          <div style="width:90%" class="progressBottom">
            <div class="Avg_score">Score&nbsp;${agent.Avg_Total_Score}</div>
            <div class="percentile">Percentile&nbsp;${agent.percentile}</div>
          </div>
        </div>
      </li>`;
    });
    if(pagination == ""){
        pagination += `<nav aria-label="Page navigation">
        <ul class="pagination">
        <li class="page-item disabled prevLi">
        <a class="page-link" href="#" aria-label="Previous" onclick="changePageNo('prev')">
          <span aria-hidden="true">&laquo;</span>
          <span class="sr-only">Previous</span>
        </a>
      </li>`;
        for (let page = 1; page <= (totalPages<10?totalPages:10); page++) {
            pagination += `<li class="page-item"><a class="page-link" href="#" data-pagination="${page}" onclick="changePageNo(${page})">${page}</a></li>`;
        }
        pagination += `    <li class="page-item nextLi">
        <a class="page-link" href="#" aria-label="Next" onclick="changePageNo('next')">
          <span aria-hidden="true">&raquo;</span>
          <span class="sr-only">Next</span>
        </a>
      </li>
    </ul>
    </nav>`;
    paginationContainer.innerHTML = pagination;
    // document.querySelector(`a[data-pagination="1"]`).classList.add('active');
    // document.querySelector(`a[data-pagination="1"]`).parentNode.classList.add('active');
    }

    performerslist.innerHTML = html;
     loadNewPerformance(document.querySelector('.performerslist > ul >li:first-child'));
    // Add click event listener to each <li> element
    const liElements = performerslist.querySelectorAll('li');
    liElements.forEach(li => {
        li.addEventListener('click', function() {
            loadNewPerformance(this);
        });
    });
}

function changePageNo(newPage){
    if(newPage == "next"){
        activePage +=1;
    }
    else if(newPage == "prev"){
        activePage -=1;
    }
    else{
        activePage = newPage;
    }
    if(activePage == 1){
      document.querySelector(".prevLi").classList.add("disabled");
    }
    else{
      document.querySelector(".prevLi").classList.remove("disabled");
    }

    if(activePage == (totalPages<10?totalPages:10)){
      document.querySelector(".nextLi").classList.add("disabled");
    }
    else{
      document.querySelector(".nextLi").classList.remove("disabled");
    }
    document.querySelectorAll(".pagination .active").forEach(activeElements => {
      activeElements.classList.remove("active");
    })
    document.querySelector(`a[data-pagination="${activePage}"]`).classList.add('active');
    document.querySelector(`a[data-pagination="${activePage}"]`).parentNode.classList.add('active');
    fetchData(startCode, endCode,document.querySelector(`li[selected="true"]`).getAttribute("data-project"));
}

function loadNewPerformance(li){
    showPerformance(response.performance.find(item => item.rank === Number(li.getAttribute('data-rank'))));
}

function showPerformance(performanceJSON){
    let html = `
    <div class="medalContainer">
    <div class="quiz-medal">
      <div class="quiz-medal__circle quiz-medal__circle--gold">
        <span>
          ${performanceJSON.rank}
        </span>
      </div>
      <div class="quiz-medal__ribbon quiz-medal__ribbon--left"></div>
      <div class="quiz-medal__ribbon quiz-medal__ribbon--right"></div>
    </div>
  </div>
  <div class="basicDetails">
    <div class="imageContainer">
      <div class="image">
        <img data-id="${performanceJSON.ID}" src="${performanceJSON.Photo}"/>
      </div>
    </div>

    <div>
      <div class="name">
      ${performanceJSON.name}
      </div>
      <div class="employeeID">
      ${performanceJSON.empID}
      </div>
    </div>
  </div>
  <div class="performanceDetails">
    <div class="scores">
      <div class="avgTotalScore">
        <label>Avg. Score</label>
        <div class="value">${performanceJSON.Avg_Total_Score}</div>
      </div>
      <div class="incentive">
        <label>Incentive</label>
        <div class="value">${performanceJSON.Incentive}</div>
      </div>
    </div>
  </div>`;
  topPerformer.innerHTML = html;
}

function loadSideBar(resp){
    HeadHtml = `<div>
    <div class="image-previewer">
      <img src="${resp.project_head.Photo}"/>
    </div>
  </div>
  <div class="managerDetails">
      <h4>${resp.project_head.Name}</h4>
      <h5>${resp.project_head.empID}</h5>
      <h6>Project Head</h6>
  </div>`;
  document.querySelector('.manager').innerHTML = HeadHtml;
  totalScore.querySelector('.left h5').innerText = resp.total_score.average;
  totalScore.querySelector('.right h5').innerText = resp.total_score.highest;
  efficiency.querySelector('.left h5').innerText = resp.efficiency.average;
  efficiency.querySelector('.right h5').innerText = resp.efficiency.highest;
  quality.querySelector('.left h5').innerText = resp.quality.average;
  quality.querySelector('.right h5').innerText = resp.quality.highest;
  productivity.querySelector('.left h5').innerText = resp.productivity.average;
  productivity.querySelector('.right h5').innerText = resp.productivity.highest;
  attendance.querySelector('.left h5').innerText = resp.attendance.average;
  attendance.querySelector('.right h5').innerText = resp.attendance.highest;
}

let myBarChart = null; // Initialize the chart instance
function loadChart(mapArray){

const canvas = document.getElementById('myChart');

const container = document.querySelector('.Graph1');
// Set the canvas dimensions to match the container dimensions
canvas.width = container.offsetWidth;
canvas.height = container.offsetHeight;

const ctx = canvas.getContext('2d');
// Data with datasets options
var data = {
    labels: ["Platinum","Diamond","Gold","Silver","Disqualified"],
    datasets: [
        {
            label: "Incentive Stack Code",
            fill: true,
            backgroundColor: ['#CECECE','#b9f2ff','#FFD700','#e6e6e6','#f46770'],
            data: stackArray
        }
    ]
};

// Notice how nested the beginAtZero is
var Baroptions = {
    title: {
        display: true,
        text: 'Incentive Stack Report',
        position: 'bottom'
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
};

 // Destroy the existing chart instance if it exists
 if (myBarChart) {
    myBarChart.destroy();
}

// Chart declaration:
myBarChart = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: Baroptions
});
}  


  
  

