// *********
// |docname|
// *********
// This file contains the JS for the Runestone fillintheblank component. It was created By Isaiah Mayerchak and Kirby Olson, 6/4/15 then revised by Brad Miller, 2/7/20.
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./nc-i18n.en.js";
// import "./NC-i18n.pt-br.js";
import "../css/nc.css";
import { Pass } from "codemirror";

export var NCList = {}; // Object containing all instances of NC that aren't a child of a timed assessment.

// NC constructor
export default class NC extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;
        this.correct = null;
        this.num_digits = 8;
        // See comments in NC.py for the format of ``feedbackArray`` (which is identical in both files).
        //
        // Find the script tag containing JSON and parse it. See `SO <https://stackoverflow.com/questions/9320427/best-practice-for-embedding-arbitrary-json-in-the-dom>`_. If this parses to ``false``, then no feedback is available; server-side grading will be performed.
        // this.feedbackArray = JSON.parse(
        //     this.scriptSelector(this.origElem).html()
        // );
        this.createNCElement();
        this.generateNumber();
        this.caption = "Number Conversion";
        this.addCaption("runestone");
        this.checkServer("nc", true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }
    }
    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }
    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/
    createNCElement() {
        this.renderNCInput();
        this.renderNCButtons();
        this.renderNCFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }
    renderNCInput() {
        // The text [input] elements are created by the template.
        this.containerDiv = document.createElement("div");

        this.containerDiv.append("Convert from");
        this.option_binary_from = document.createElement("option");
        this.option_binary_from.setAttribute("value", "binary");
        this.option_binary_from.textContent = "binary";
        this.option_binary_from.setAttribute("selected", "selected");
        this.option_decimal_from = document.createElement("option");
        this.option_decimal_from.setAttribute("value", "decimal");
        this.option_decimal_from.textContent = "decimal";
        this.option_hexadecimal_from = document.createElement("option");
        this.option_hexadecimal_from.setAttribute("value", "hexadecimal");
        this.option_hexadecimal_from.textContent = "hexadecimal";

        this.conversion_from = document.createElement("select");
        this.conversion_from.id = this.divid + "_conversion_from";
        this.conversion_from.appendChild(this.option_binary_from);
        this.conversion_from.appendChild(this.option_decimal_from);
        this.conversion_from.appendChild(this.option_hexadecimal_from);
        this.containerDiv.appendChild(this.conversion_from);

        this.containerDiv.append(" to ");

        this.option_binary_to = document.createElement("option");
        this.option_binary_to.setAttribute("value", "binary");
        this.option_binary_to.textContent = "binary";
        this.option_decimal_to = document.createElement("option");
        this.option_decimal_to.setAttribute("value", "decimal");
        this.option_decimal_to.textContent = "decimal";
        this.option_decimal_to.setAttribute("selected", "selected");
        this.option_hexadecimal_to = document.createElement("option");
        this.option_hexadecimal_to.setAttribute("value", "hexadecimal");
        this.option_hexadecimal_to.textContent = "hexadecimal";

        this.conversion_to = document.createElement("select");
        this.conversion_to.id = this.divid + "_conversion_to";
        this.conversion_to.appendChild(this.option_binary_to);
        this.conversion_to.appendChild(this.option_decimal_to);
        this.conversion_to.appendChild(this.option_hexadecimal_to);
        this.containerDiv.appendChild(this.conversion_to);

        this.containerDiv.id = this.divid;

        this.containerDiv.appendChild(document.createElement("br"));
        this.displayed_number = document.createElement("code");
        this.displayed_number.id = this.divid + "_displayed_number";
        // this.displayed_number.append("");
        this.containerDiv.appendChild(this.displayed_number);

        this.input_field = document.createElement("input");
        this.input_field.setAttribute("class", "form form-control selectwidthauto");
        this.input_field.setAttribute("type", "text");
        this.input_field.setAttribute("placeholder", "number");
        this.input_field.setAttribute("size", "5");
        this.input_field.setAttribute("aria-label", "input area");
        this.input_field.id = this.divid + "_input_field";
        this.containerDiv.appendChild(this.input_field);


        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);

        // Remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
        // Set the class for the text inputs, then store references to them.
        let ba = $(this.containerDiv).find(":input");
        ba.attr("class", "form form-control selectwidthauto");
        ba.attr("aria-label", "input area");
        this.blankArray = ba.toArray();
        // When a blank is changed mark this component as interacted with.
        // And set a class on the component in case we want to render components that have been used
        // differently
        for (let blank of this.blankArray) {
            $(blank).change(this.recordAnswered.bind(this));
        }
    }

    recordAnswered() {
        this.isAnswered = true;
        //let rcontainer = this.containerDiv.closest(".runestone");
        //rcontainer.addClass("answered");
    }

    renderNCButtons() {
        // "submit" button and "compare me" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_NC_check_me");
        $(this.submitButton).attr({
            class: "btn btn-success",
            name: "do answer",
            type: "button",
        });
        this.submitButton.addEventListener(
            "click",
            function () {
                this.checkCurrentAnswer();
                this.logCurrentAnswer();
            }.bind(this),
            false
        );

        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_NC_generate_a_number");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a number",
            type: "button",
        });
        this.generateButton.addEventListener(
            "click",
            function () {
                this.clearAnswer();
                this.generateNumber();
            }.bind(this),
            false
        );

        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);

    }
    renderNCFeedbackDiv() {
        this.feedBackDiv = document.createElement("div");
        this.feedBackDiv.id = this.divid + "_feedback";
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedBackDiv);
    }
    clearAnswer() {
        this.input_field.setAttribute("value", "");
    }
    toBinary(num) {
        var ret = "";
        for (var i = 0 ; i < this.num_digits; i ++ ) {
            ret += (1 & num).toString();
            num = num >>> 1;
        }
        return ret.split('').reverse().join('');
    }
    generateNumber() {
        var target_num = Math.floor(Math.random() * (1 << this.num_digits) ) - (1 << (this.num_digits - 1) ) ;
        switch (this.conversion_from.value) {
            case "binary" : 
                this.displayed_num_string = this.toBinary(target_num);
                this.displayed_number.textContent = "0b" + this.displayed_num_string + " = ";
                break;
            case "decimal" : 
                this.displayed_num_string = target_num.toString(10);
                this.displayed_number.textContent = this.displayed_num_string + " = ";
                break;
            case "hexadecimal" : 
                this.displayed_num_string = target_num.toString(16);
                this.displayed_number.textContent = "0x" + this.displayed_num_string + " = ";
                break;
        }
        switch (this.conversion_to.value) {
            case "binary" : 
                this.target_num_string = this.toBinary(target_num);
                this.displayed_number.append("0b");
                break;
            case "decimal" : 
                this.target_num_string = target_num.toString(10);
                break;
            case "hexadecimal" : 
                this.target_num_string = target_num.toString(16);
                this.displayed_number.append("0x");
                break;
        }
        
    }
    /*===================================
    === Checking/loading from storage ===
    ===================================*/
    restoreAnswers(data) {
        var arr;
        // Restore answers from storage retrieval done in RunestoneBase.
        try {
            // The newer format encodes data as a JSON object.
            arr = JSON.parse(data.answer);
            // The result should be an array. If not, try comma parsing instead.
            if (!Array.isArray(arr)) {
                throw new Error();
            }
        } catch (err) {
            // The old format didn't.
            arr = data.answer.split(",");
        }
        for (var i = 0; i < this.blankArray.length; i++) {
            $(this.blankArray[i]).attr("value", arr[i]);
        }
        // Use the feedback from the server, or recompute it locally.
        // if (!this.feedbackArray) {
        //     this.displayFeed = data.displayFeed;
        //     this.correct = data.correct;
        //     this.isCorrectArray = data.isCorrectArray;
        //     // Only render if all the data is present; local storage might have old data missing some of these items.
        //     if (
        //         typeof this.displayFeed !== "undefined" &&
        //         typeof this.correct !== "undefined" &&
        //         typeof this.isCorrectArray !== "undefined"
        //     ) {
        //         this.renderFeedback();
        //     }
        // } else {
        //     this.checkCurrentAnswer();
        // }
    }
    checkLocalStorage() {
        // Loads previous answers from local storage if they exist
        var storedData;
        if (this.graderactive) {
            return;
        }
        var len = localStorage.length;
        if (len > 0) {
            var ex = localStorage.getItem(this.localStorageKey());
            if (ex !== null) {
                try {
                    storedData = JSON.parse(ex);
                    var arr = storedData.answer;
                } catch (err) {
                    // error while parsing; likely due to bad value stored in storage
                    console.log(err.message);
                    localStorage.removeItem(this.localStorageKey());
                    return;
                }
                // this.restoreAnswers(storedData);
            }
        }
    }
    setLocalStorage(data) {
        let key = this.localStorageKey();
        localStorage.setItem(key, JSON.stringify(data));
    }

    checkCurrentAnswer() {

        var input_value = this.input_field.value.toLowerCase();
        if ( input_value === "" ) {
            // this.isCorrectArray.push(null);
            this.feedback_msg = ($.i18n("msg_no_answer"));
            this.correct = false;
        } else if ( input_value != this.target_num_string ) {
            // this.displayFeed.push($.i18n("msg_no_answer"));
            this.feedback_msg = ($.i18n("msg_NC_incorrect"));
            this.correct = false;            
        } else {
            this.feedback_msg = ($.i18n("msg_NC_correct"));
            this.correct = true;
        }
    }

    async logCurrentAnswer(sid) {
        let answer = JSON.stringify(this.given_arr);
        // Save the answer locally.
        let feedback = true;
        this.setLocalStorage({
            answer: answer,
            timestamp: new Date(),
        });
        let data = {
            event: "numconv",
            act: answer || "",
            answer: answer || "",
            correct: this.correct ? "T" : "F",
            div_id: this.divid,
        };
        if (typeof sid !== "undefined") {
            data.sid = sid;
            feedback = false;
        }
        
        // Per `logBookEvent <logBookEvent>`, the result is undefined if there's no server. Otherwise, the server provides the endpoint-specific results in ``data.details``; see `make_json_response`.
        // data = await this.logBookEvent(data);
        // let detail = data && data.detail;
        // if (!feedback) return;
        // if (!this.feedbackArray) {
        //     // On success, update the feedback from the server's grade.
        //     this.setLocalStorage({
        //         answer: answer,
        //         timestamp: detail.timestamp,
        //     });
        //     this.correct = detail.correct;
        //     this.displayFeed = detail.displayFeed;
        //     this.isCorrectArray = detail.isCorrectArray;
        //     if (!this.isTimed) {
        //         this.renderFeedback();
        //     }
        // }
        // return detail;
        this.renderFeedback();
        return data;
    }

    /*==============================
    === Evaluation of answer and ===
    ===     display feedback     ===
    ==============================*/
    // Inputs:
    //
    // - Strings entered by the student in ``this.blankArray[i].value``.
    // - Feedback in ``this.feedbackArray``.
    //
    // Outputs:
    //
    // - ``this.displayFeed`` is an array of HTML feedback.
    // - ``this.isCorrectArray`` is an array of true, false, or null (the question wasn't answered).
    // - ``this.correct`` is true, false, or null (the question wasn't answered).
    evaluateAnswers() {
        // Keep track if all answers are correct or not.
        this.correct = true;
        for (var i = 0; i < this.blankArray.length; i++) {
            var given = this.blankArray[i].value;
            // If this blank is empty, provide no feedback for it.
            if (given === "") {
                this.isCorrectArray.push(null);
                this.displayFeed.push($.i18n("msg_no_answer"));
                this.correct = false;
            } else {
                // Look through all feedback for this blank. The last element in the array always matches. If no feedback for this blank exists, use an empty list.
                var fbl = this.feedbackArray[i] || [];
                for (var j = 0; j < fbl.length; j++) {
                    // The last item of feedback always matches.
                    if (j === fbl.length - 1) {
                        this.displayFeed.push(fbl[j]["feedback"]);
                        break;
                    }
                    // If this is a regexp...
                    if ("regex" in fbl[j]) {
                        var patt = RegExp(
                            fbl[j]["regex"],
                            fbl[j]["regexFlags"]
                        );
                        if (patt.test(given)) {
                            this.displayFeed.push(fbl[j]["feedback"]);
                            break;
                        }
                    } else {
                        // This is a number.
                        console.assert("number" in fbl[j]);
                        var [min, max] = fbl[j]["number"];
                        // Convert the given string to a number. While there are `lots of ways <https://coderwall.com/p/5tlhmw/converting-strings-to-number-in-javascript-pitfalls>`_ to do this; this version supports other bases (hex/binary/octal) as well as floats.
                        var actual = +given;
                        if (actual >= min && actual <= max) {
                            this.displayFeed.push(fbl[j]["feedback"]);
                            break;
                        }
                    }
                }
                // The answer is correct if it matched the first element in the array. A special case: if only one answer is provided, count it wrong; this is a misformed problem.
                let is_correct = j === 0 && fbl.length > 1;
                this.isCorrectArray.push(is_correct);
                if (!is_correct) {
                    this.correct = false;
                }
            }
        }
        this.percent =
            this.isCorrectArray.filter(Boolean).length / this.blankArray.length;
    }

    renderFeedback() {
        var feedback_html = "<dev>" + this.feedback_msg + "</dev>";
        if (this.correct) {
            $(this.feedBackDiv).attr("class", "alert alert-info");
            // feedback_html += "Correct. Good Job!";
            // for (let j = 0; j < this.blankArray.length; j++) {
            //     $(this.blankArray[j]).removeClass("input-validation-error");
            // }
        } else {
            // if (this.displayFeed === null) {
            //     this.displayFeed = "";
            // }
            // for (let j = 0; j < this.blankArray.length; j++) {
            //     if (this.isCorrectArray[j] !== true) {
            //         $(this.blankArray[j]).addClass("input-validation-error");
            //     } else {
            //         $(this.blankArray[j]).removeClass("input-validation-error");
            //     }
            // }
            $(this.feedBackDiv).attr("class", "alert alert-danger");
            // feedback_html += "Incorrect. Please think again.";
        }
        
        // for (var i = 0; i < this.displayFeed.length; i++) {
        //     feedback_html += "<li>" + this.displayFeed[i] + "</li>";
        // }
        // feedback_html += "</dev>";
        // Remove the list if it's just one element.
        // if (this.displayFeed.length == 1) {
        //     feedback_html = feedback_html.slice(
        //         "<ul><li>".length,
        //         -"</li></ul>".length
        //     );
        // }
        this.feedBackDiv.innerHTML = feedback_html;
        if (typeof MathJax !== "undefined") {
            this.queueMathJax(document.body);
        }
        // alert("I'm debugging here.");
    }

    /*==================================
    === Functions for compare button ===
    ==================================*/
    enableCompareButton() {
        this.compareButton.disabled = false;
    }
    // _`compareNCAnswers`
    compareNCAnswers() {
        var data = {};
        data.div_id = this.divid;
        data.course = eBookConfig.course;
        jQuery.get(
            `${eBookConfig.new_server_prefix}/assessment/gettop10Answers`,
            data,
            this.compareNC
        );
    }
    compareNC(data, status, whatever) {
        var answers = data.detail.res;
        var misc = data.detail.miscdata;
        var body = "<table>";
        body += "<tr><th>Answer</th><th>Count</th></tr>";
        for (var row in answers) {
            body +=
                "<tr><td>" +
                answers[row].answer +
                "</td><td>" +
                answers[row].count +
                " times</td></tr>";
        }
        body += "</table>";
        var html =
            "<div class='modal fade'>" +
            "    <div class='modal-dialog compare-modal'>" +
            "        <div class='modal-content'>" +
            "            <div class='modal-header'>" +
            "                <button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button>" +
            "                <h4 class='modal-title'>Top Answers</h4>" +
            "            </div>" +
            "            <div class='modal-body'>" +
            body +
            "            </div>" +
            "        </div>" +
            "    </div>" +
            "</div>";
        var el = $(html);
        el.modal();
    }

    disableInteraction() {
        for (var i = 0; i < this.blankArray.length; i++) {
            this.blankArray[i].disabled = true;
        }
    }
}

/*=================================
== Find the custom HTML tags and ==
==   execute our code on them    ==
=================================*/
$(document).on("runestone:login-complete", function () {
    $("[data-component=numberconversion]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                NCList[this.id] = new NC(opts);
            } catch (err) {
                console.log(
                    `Error rendering Number Conversion Problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});
