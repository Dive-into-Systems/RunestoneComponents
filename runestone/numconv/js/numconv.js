// *********
// |docname|
// *********
// This file contains the JS for the Runestone numberconversion component. It was created By Isaiah Mayerchak and Kirby Olson, 6/4/15 then revised by Brad Miller, 2/7/20.
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
        // default number of bits
        this.num_bits = 8;
        
        this.createNCElement();
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
    // optionSelector(root_node) {
    //     return $(root_node).find(`div[id="conv_options"]`);
    // }
    /*===========================================
    ====   Functions generating final HTML   ====
    ===========================================*/
    createNCElement() {
        this.renderNCInput();
        this.renderNCButtons();
        this.renderNCFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);

        // alert(this.num_bits);
    }
    renderNCInput() {
        // qwerty
        // Generate the two dropdown menus for number conversion
        this.containerDiv = document.createElement("div");
        this.containerDiv.id = this.divid;
        
        // new from here

        this.newStatement = document.createElement("div");

        this.statementNode1 = document.createTextNode("Convert from ");
        this.menuArray1 = ["binary", "decimal-unsigned", "decimal-signed", "hexadecimal"];

        this.fromOpt = this.menuArray1;
        this.toOpt = this.menuArray1;
        
        var currOption = JSON.parse(
            this.scriptSelector(this.origElem).html()
        );
        // var currOption = $(document).getElementById("conv_options");

        // alert("start" + currOption);
        if (currOption["bits"] != undefined) {
            this.num_bits = eval(currOption["bits"]);
            // alert("change proceeded to "+currOption["bits"]);
        }
        if ( this.num_bits % 4 != 0 ){
            alert($.i18n("msg_NC_not_divisible_by_4"));
            return;
        }
        if ( this.num_bits > 64 ){
            alert($.i18n("msg_NC_too_many_bits"));
            return;
        }
        if (currOption["from-options"] === undefined) {
            this.fromOpt = this.menuArray1;
        } else {
            this.fromOpt = currOption["from-options"];
        }
        
        if (currOption["to-options"] === undefined) {
            this.toOpt = this.menuArray1;
        } else {
            this.toOpt = currOption["to-options"];
        }

        this.menuNode1 = document.createElement("select");
        for (var i = 0; i < this.fromOpt.length; i++) {
            var option = document.createElement("option");
            option.value = this.fromOpt[i];  
            option.text = this.fromOpt[i];
            this.menuNode1.appendChild(option);
        }
        this.menuNode1.setAttribute("class", "form form-control selectwidthauto");
        this.menuNode1.addEventListener("change",
            function () {
                this.clearAnswer();
                this.generateNumber();
                this.checkValidConversion();
                if ( this.valid_conversion ) {
                    this.generateAnswer();
                }
            }.bind(this),
            false);

        this.statementNode2 = document.createTextNode(" to ");
        
        this.menuNode2 = document.createElement("select");
        for (var i = 0; i < this.toOpt.length; i++) {
            var option = document.createElement("option");
            option.value = this.toOpt[i];
            option.text = this.toOpt[i];
            this.menuNode2.appendChild(option);
        }
        this.menuNode2.setAttribute("class", "form form-control selectwidthauto");
        this.menuNode2.addEventListener("change",
            function () {
                this.checkValidConversion();
                if (this.valid_conversion) {
                    if (this.target_num === undefined ) {
                        this.generateNumber();
                    }
                    this.clearAnswer();
                    this.generateAnswer();
                }
            }.bind(this),
            false);

        // this.optList.remove();
        this.statementNode3 = document.createTextNode(" (" + this.num_bits.toString() + "bits)");

        this.newStatement.appendChild(this.statementNode1);
        this.newStatement.appendChild(this.menuNode1);
        this.newStatement.appendChild(this.statementNode2);
        this.newStatement.appendChild(this.menuNode2);
        this.newStatement.appendChild(this.statementNode3);

        this.containerDiv.appendChild(this.newStatement);
        this.containerDiv.appendChild(document.createElement("br"));
        // this.fromType = this.menuNode1.value;
        // this.toType = this.menuNode2.value;

        this.newPrompt = document.createElement("div");

        this.newPromptTextNode = document.createElement("code");
        this.newPrompt.appendChild(this.newPromptTextNode);

        this.newInputNode = document.createElement("input");
        this.newInputNode.setAttribute('type', 'text');
        this.newInputNode.setAttribute("class", "form form-control selectwidthauto");
        this.newInputNode.setAttribute("size", "20");
        this.newInputNode.setAttribute("placeholder", "your answer");
        this.newInputNode.setAttribute("aria-label", "input area");
        this.newInputNode.setAttribute("id", this.divid + "_input");


        this.newPrompt.appendChild((this.newInputNode));
        // this.newPrompt.appendChild((this.newInputNode));
        this.containerDiv.appendChild(this.newPrompt);
        this.newPrompt.style.visibility = "hidden"; 
    // new till here

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
    }

    renderNCButtons() {
        // "check me" button and "generate a number" button
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
                this.checkValidConversion();
                if ( this.valid_conversion ) {
                    this.checkCurrentAnswer();
                    this.logCurrentAnswer();
                }
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
                this.checkValidConversion();
                if ( this.valid_conversion ) {
                    this.clearAnswer();
                    this.generateNumber();
                    this.generateAnswer();
                }
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

    // clear the input field
    clearAnswer() {
        // qwerty
        this.newInputNode.value = "";
    }

    toBinary(num) {
        var str = num.toString(2);
        if (str.length < this.num_bits) {
            var leading_zeros = "";
            for ( var i = str.length ; i < this.num_bits; i ++ ) {
                leading_zeros += "0";
            }
            str = leading_zeros + str;
        }
        return str;
    }
    toHexadecimal(num) {
        var str = num.toString(16);
        var target_len = Math.ceil(this.num_bits / 4);
        if (str.length < target_len) {
            var leading_zeros = "";
            for ( var i = str.length ; i < target_len; i ++ ) {
                leading_zeros += "0";
            }
            str = leading_zeros + str;
        }
        return str;
    }

    // generate a random number from 0 to 2^(num_bits) and set the number to display
    generateNumber() {

        this.target_num = Math.floor(Math.random() * (1 << this.num_bits) ) ;
        if (this.target_num === (1 << this.num_bits)) {
            this.target_num --;
        }
        switch (this.menuNode1.value) {
            case "binary" : 
                this.displayed_num_string = this.toBinary(this.target_num);
                break;
            case "decimal-unsigned" : 
                this.displayed_num_string = this.target_num.toString(10);
                break;
            case "decimal-signed" : 
                if ( this.target_num & ( 1 << (this.num_bits - 1) )) {
                    this.displayed_num_string = (this.target_num - (1 << this.num_bits)).toString(10); 
                } else {
                    this.displayed_num_string = this.target_num.toString(10);
                }
                break;
            case "hexadecimal" : 
                this.displayed_num_string = this.toHexadecimal(this.target_num);
                break;
        }
        
    }

    // generate the answer as a string based on the randomly generated number
    generateAnswer() {
        this.feedBackDiv.style.visibility = 'hidden';
        this.newInputNode.style.visibility = 'visible';
        this.displayFeed = [];
        // qwerty
        switch (this.menuNode2.value) {
            case "binary" : 
                this.target_num_string = this.toBinary(this.target_num);
                break;
            case "decimal-unsigned" : 
                this.target_num_string = this.target_num.toString(10);
                break;
            case "decimal-signed" : 
                if ( this.target_num & ( 1 << (this.num_bits - 1) )) {
                    this.target_num_string = (this.target_num - (1 << this.num_bits)).toString(10); 
                } else {
                    this.target_num_string = this.target_num.toString(10);
                }
                break;
            case "hexadecimal" : 
                this.target_num_string = this.toHexadecimal(this.target_num);
                break;
        }
        this.generatePrompt();
    }

    // update the prompt to display
    generatePrompt() {

        this.feedBackDiv.style.visibility = 'hidden';
        this.newInputNode.style.visibility = 'visible';
        this.displayFeed = [];

        switch(this.menuNode1.value) {
            case "binary" : 
                this.newPromptTextNode.textContent = "0b" + this.displayed_num_string + " = ";
                break;
            case "decimal-unsigned" : 
                this.newPromptTextNode.textContent = this.displayed_num_string + " = ";
                break;
            case "decimal-signed" : 
                this.newPromptTextNode.textContent = this.displayed_num_string + " = ";
                break;
            case "hexadecimal" : 
                this.newPromptTextNode.textContent = "0x" + this.displayed_num_string + " = ";
                break;           
        }
        var placeholder;
        switch(this.menuNode2.value) {
            case "binary" : 
                this.newPromptTextNode.append("0b");
                placeholder = "your answer (" + this.num_bits.toString() + "digits of binary number)";
                break;
            case "decimal-unsigned" : 
                placeholder = "your answer (unsigend decimal)";
                break;
            case "decimal-signed" : 
                placeholder = "your answer (signed decimal)";
                break;
            case "hexadecimal" : 
                this.newPromptTextNode.append("0x");
                placeholder = "your answer (" + this.num_bits.toString() + "digits of hexadecimal number)";
                break;           
        }
        this.newInputNode.setAttribute("placeholder", placeholder);
        this.newInputNode.setAttribute("size", placeholder.length);
        this.newInputNode.setAttribute("maxlength", 1+this.num_bits);
    }

    // check if the conversion is valid  
    checkValidConversion() {
        this.valid_conversion = true;
        // a conversion is valid when two types are different
        if (this.menuNode1.value === this.menuNode2.value) {
            this.valid_conversion = false;
            this.correct = false;
            this.feedback_msg = ($.i18n("msg_NC_same_exp"));
            this.renderFeedback();
            this.newInputNode.style.visibility = "hidden";
            this.newPromptTextNode.textContent = "";
        } else if ((this.menuNode1.value.valueOf() == "decimal-signed".valueOf() && this.menuNode2.value.valueOf() != "binary".valueOf()) || (this.menuNode2.value.valueOf() == "decimal-signed".valueOf() && this.menuNode1.value.valueOf() != "binary".valueOf())) {
            this.valid_conversion = false;
            this.correct = false;
            this.feedback_msg = ($.i18n("msg_fitb_two02dec"));
            this.renderFeedback();
            this.newInputNode.style.visibility = 'hidden';
            this.newPromptTextNode.textContent = "";
            return;
        } else {
            this.newPrompt.style.visibility = "visible";
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
    
    // check if the answer is correct
    checkCurrentAnswer() {
        // the answer is correct if it is the same as the string this.target_num_string
        var input_value = this.newInputNode.value.toLowerCase();
        if ( input_value === "" ) {
            this.feedback_msg = ($.i18n("msg_no_answer"));
            this.correct = false;
        } else if ( input_value != this.target_num_string ) {
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
    
    hideFeedback() {
        this.feedBackDiv.style.visibility = "hidden";
    }

    renderFeedback() {
        this.feedBackDiv.style.visibility = "visible";
        // only the feedback message needs to display
        var feedback_html = "<dev>" + this.feedback_msg + "</dev>";
        if (this.correct) {
            $(this.feedBackDiv).attr("class", "alert alert-info");
        } else {
            $(this.feedBackDiv).attr("class", "alert alert-danger");
        }
        
        this.feedBackDiv.innerHTML = feedback_html;
        this.feedBackDiv.style.visibility = "visible";
        if (typeof MathJax !== "undefined") {
            this.queueMathJax(document.body);
        }
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
