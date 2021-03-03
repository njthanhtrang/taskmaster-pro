var tasks = {};

var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");

  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);

  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function () {
  // tasks saved in array that's a property of object
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

var auditTask = function(taskEl) {
  // get date from task element, .trim() is JS
  var date = $(taskEl).find("span").text().trim();

  // convert to moment object at 5:00pm local time
  var time = moment(date, "L").set("hour", 17);

  // remove old classes from element, if update due date, red background removed
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
    // Math.abs() gets absolute value of today-future date
  } else if (Math.abs(moment().diff(time, "days")) <=2) {
    $(taskEl).addClass("list-group-item-warning");
  }
  console.log(taskEl);
};

// enable drag and drop within same column and across other columns
$(".card .list-group").sortable({
  // connectWith links sortable lists with any other lists with same class
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  // create copy of dragged element and move copy instead of og
  helper: "clone",
  // trigger once for all connected lists as son as dragging starts+stops
  activate: function (event, ui) {
    console.log(ui)
    $(this).addClass("dropover")
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  // trigger once for all connected lists as son as dragging starts+stops
  deactivate: function (event, ui) {
    console.log(ui)
    $(this).removeClass("dropover")
    $(".bottom-trash").removeClass(".bottom-class-drag");
  },
  // trigger when a dragged item enters/leaves connected list
  over: function (event) {
    console.log(event)
    $(event.target).addClass("dropover-active");
  },
  // trigger when a dragged item enters/leaves connected list
  out: function (event) {
    console.log(event)
    $(event.target).removeClass("dropover-active");
  },
  update: function () {
    var tempArr = [];

    // loop over current set of children in sortable list
    // each() runs callback for every item/element in array
    $(this).children().each(function () {
      // add task data to temp array as object
      tempArr.push({
        text: $(this)
          .find("p")
          .text()
          .trim(),
        date: $(this)
          .find("span")
          .text()
          .trim()
      });
    });
    // trim down list's ID to match object property
    var arrName = $(this)
      .attr("id")
      .replace("list-", "");

    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  },
  stop: function (event) {
    $(this).removeClass("dropover");
  }
});
// trash icon can be dropped onto
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function (event, ui) {
    // remove dragged element from DOM
    ui.draggable.remove()
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  over: function (event, ui) {
    console.log(ui)
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function (event, ui) {
    console.log(ui)
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
});
// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});
// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    // description, due date, type
    // creates <li> with child <span> and <p> appended to <ul>
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// task text was clicked
$(".list-group").on("click", "p", function () {
  // get current text of p element
  // OR var text = $(this).text().trim();
  var text = $(this)
    .text()
    .trim();

  // $("textarea") finds all existing elements
  // $("<textarea>") creates a new <textarea> with HTML syntax
  // replace p element with new textarea
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);

  $(this).replaceWith(textInput);
  // auto focus new element
  textInput.trigger("focus");
});

// editable field was un-focused
$(".list-group").on("blur", "textarea", function () {
  // get textarea's current value/text
  var text = $(this)
    .val();

  // get parent ul's id attribute for status type and position in list
  var status = $(this)
    .closest(".list-group")
    // returns ID ("list-____")
    .attr("id")
    // .replace not a jQuery method, regular JS operator
    // removes list- from text, gives us category name ("toDo")
    // which matches one of the arrays on tasks object (tasks.toDo)
    .replace("list-", "");

  // get task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and resave to localStorage
  // tasks is an object
  // tasks[status] returns array (e.g. toDo)
  // tasks[status][index] returns object at given index
  // tasks[status][index].text returns text of object at given index
  tasks[status][index].text = text;
  saveTasks();

  // recreate p element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// due date was clicked
$(".list-group").on("click", "span", function () {
  // get current text
  var date = $(this)
    .text()
    .trim();

  // create new input element
  // use jQuery's attr() to set as type="text"
  // attr("id") GETS attribute, attr("type", "text") SETS attribute
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  // swap out elements
  $(this).replaceWith(dateInput);

  // enable jQuery UI datepicker
  dateInput.datepicker({
    minDate: 1,
    // instruct dateInput element to trigger its own change event+execute callback tied to it
    onClose: function() {
      // when calendar is closed, force a "change" event on the 'dateInput'
      $(this).trigger("change");
    }
  });

  // automatically focus on new element, bring up calendar
  dateInput.trigger("focus");
});

// value of due date was changed
$(".list-group").on("change", "input[type='text']", function () {
  // get current text
  var date = $(this)
    .val();

  // get parent ul's id attribute for status type and position in the list
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to localStorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes, insert in place of input element
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);
  // replace input with span element
  $(this).replaceWith(taskSpan);

  // pass task's <li> element into auditTask() to check new due date
  // audit tasks when they are edited
  auditTask($(taskSpan).closest(".list-group-item"));
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  console.log(tasks);
  saveTasks();
});

// adds calendar
$("#modalDueDate").datepicker({
  // days after current date we want limit to kick in
  minDate: 1
});

// load tasks for the first time
loadTasks();

setInterval(function() {
  // loop over every task with class list-group-item.... each element
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
  // 30-min timer
}, (1000* 60) * 30);


