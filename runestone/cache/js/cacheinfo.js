// *********
// |docname|
// *********
// This file contains the JS for the Runestone cacheinfo component. It was created By Isaiah Mayerchak and Kirby Olson, 6/4/15 then revised by Brad Miller, 2/7/20.
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./cache-i18n.en.js";
// import "./cacheinfo-i18n.pt-br.js";
import "../css/cache.css";
import { Pass } from "codemirror";

export var cacheinfoList = {}; // Object containing all instacacheinfoes of cacheinfo that aren't a child of a timed assessment.

// cacheinfo constructor
export default class cacheinfo extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;
        this.correct = null;
        // default number of bits
        this.num_bits = 4;
        
        this.createCacheInfoElement();
        this.caption = "Cache System";
        this.addCaption("runestone");
        this.checkServer("cacheinfo", true);
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
    ====   functions generating final HTML   ====
    ===========================================*/
    createCacheInfoElement() {
        this.feedbackDiv = document.createElement("div");
        this.renderCacheInfoInput();
        this.renderCacheInfoButtons();
        this.renderCacheInfofeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);

        // alert(this.num_bits);
    }
    renderCacheInfoInput() {
        // qwerty
        // Generate the drop-down menu for cache organization
        this.containerDiv = document.createElement("div");
        this.questionPart = document.createElement("div");
        this.containerDiv.id = this.divid;
        
        this.prompt1 = document.createElement("div");
        this.prompt1.append("Cache organization : ");

        this.cacheOrgArray = ["Direct-Mapped", "2-Way Set Associative", "4-Way Set Associative"];
        
        // get input from user
        // var currOption = JSON.parse(
        //     this.scriptSelector(this.origElem).html()
        // );
    
        this.orgMenuNode = document.createElement("select");
        for (var i = 0; i < this.cacheOrgArray.length; i++) {
            var option = document.createElement("option");
            option.value = this.cacheOrgArray[i];  
            option.text = this.cacheOrgArray[i];
            this.orgMenuNode.appendChild(option);
        }
        this.orgMenuNode.setAttribute("class", "form form-control selectwidthauto");
        this.orgMenuNode.addEventListener("change",
            function () {
                // this.num_bits = this.addrMenuNode.value;
                this.clearInput();
                this.generateAnswer();
            }.bind(this),
            false);

        // Generate the drop-down menu for address length
        this.bitsLengthArray = ["4 bits", "8 bits", "16 bits"];
        
        this.addrMenuNode = document.createElement("select");
        for (var i = 0; i < this.bitsLengthArray.length; i++) {
            var option = document.createElement("option");
            option.value = this.bitsLengthArray[i];
            option.text = this.bitsLengthArray[i];
            this.addrMenuNode.appendChild(option);
        }
        this.addrMenuNode.setAttribute("class", "form form-control selectwidthauto");
        this.addrMenuNode.addEventListener("change",
            function () {
                // this.num_bits = this.addrMenuNode.value;
                this.updateNumBits();
                this.generateAddress();
                this.clearInput();
                this.generateAnswer();
            }.bind(this),
            false);
        
        this.addressNode = document.createElement("div");
        this.addressNodeText = document.createTextNode("address: ");
        this.addressNodeAddress = document.createElement("code");
        this.addressNodeAddress.textContent = this.address_eg;
        this.addressNode.appendChild(this.addressNodeText);
        this.addressNode.appendChild(this.addressNodeAddress);

        this.partitionNode = document.createElement("div");
        this.tagNodeText = document.createTextNode("tag: ");
        this.tagNodeTag = document.createElement("code");
        this.tagNodeTag.textContent = this.tag_bits;
        this.indexNodeText = document.createTextNode(" index: ");
        this.indexNodeIndex = document.createElement("code");
        this.indexNodeIndex.textContent = this.index_bits;
        this.offsetNodeText = document.createTextNode(" offset: ");
        this.offsetNodeOffset = document.createElement("code");
        this.offsetNodeOffset.textContent = this.offset_bits;
        this.partitionNode.appendChild(this.tagNodeText);
        this.partitionNode.appendChild(this.tagNodeTag);
        this.partitionNode.appendChild(this.indexNodeText);
        this.partitionNode.appendChild(this.indexNodeIndex);
        this.partitionNode.appendChild(this.offsetNodeText);
        this.partitionNode.appendChild(this.offsetNodeOffset);
        
        this.newStatement = document.createElement("div");
        this.newStatement.appendChild(this.orgMenuNode);
        this.newStatement.appendChild(this.addrMenuNode);
        this.newStatement.appendChild(document.createElement("br"));
        this.newStatement.appendChild(this.addressNode);
        this.newStatement.appendChild(document.createElement("br"));
        this.newStatement.appendChild(this.partitionNode);
        this.newStatement.appendChild(document.createElement("br"));

        this.containerDiv.appendChild(this.newStatement);
        this.containerDiv.appendChild(document.createElement("br"));
        
        // generate question prompts and input fields
        this.question1 = document.createElement("div");
        this.question1Prompt = document.createTextNode($.i18n("block_size") + "\t=\t");
        this.inputNode1 = document.createElement("input");
        this.inputNode1.setAttribute('type', 'text');
        this.inputNode1.setAttribute("size", "10");
        this.inputNode1.setAttribute("placeholder", "your answer");
        this.question1.appendChild(this.question1Prompt);
        this.question1.appendChild(this.inputNode1);

        this.question2 = document.createElement("div");
        this.question2Prompt = document.createTextNode($.i18n("num_rows") + "\t=\t");
        this.inputNode2 = document.createElement("input");
        this.inputNode2.setAttribute('type', 'text');
        this.inputNode2.setAttribute("size", "10");
        this.inputNode2.setAttribute("placeholder", "your answer");
        this.question2.appendChild(this.question2Prompt);
        this.question2.appendChild(this.inputNode2);

        this.question3 = document.createElement("div");
        this.question3Prompt = document.createTextNode($.i18n("num_lines") + "\t=\t");
        this.inputNode3 = document.createElement("input");
        this.inputNode3.setAttribute('type', 'text');
        this.inputNode3.setAttribute("size", "10");
        this.inputNode3.setAttribute("placeholder", "your answer");
        this.question3.appendChild(this.question3Prompt);
        this.question3.appendChild(this.inputNode3);

        this.inputNodes = [this.inputNode1, this.inputNode2, this.inputNode3];
        this.questionPart.appendChild(this.question1);
        this.questionPart.appendChild(this.question3);
        this.questionPart.appendChild(this.question2);
        this.containerDiv.appendChild(this.questionPart);
        this.containerDiv.appendChild(document.createElement("br"));

        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);
        
        this.generateAddress();
        this.generateAnswer();

        // Remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
        // Set the class for the text inputs, then store referecacheinfoes to them.
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

    renderCacheInfoButtons() {
        // "check me" button and "generate a number" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_cacheinfo_check_me");
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
        this.generateButton.textContent = $.i18n("msg_cacheinfo_generate_a_number");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "Generate an Address",
            type: "button",
        });
        this.generateButton.addEventListener(
            "click",
            function () {
                this.generateAddress();
                this.clearInput();
                this.generateAnswer();
            }.bind(this),
            false)
        ;

        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);
    }

    renderCacheInfofeedbackDiv() {
        this.feedbackDiv.id = this.divid + "_feedback";
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    // clear the input field
    clearInput() {
        for ( var i = 0 ; i < 3; i ++ ) {
            this.inputNodes[i].value = "";
            this.inputNodes[i].setAttribute("class", "form form-control selectwidthauto");
        }
    }

    updateNumBits() {
        switch (this.addrMenuNode.value) {
            case "4 bits":
                this.num_bits = 4;
                break;
            case "8 bits":
                this.num_bits = 8;
                break;
            case "16 bits":
                this.num_bits = 16;
                break;
        }
    }
    // generate a memory address
    generateAddress() {
        // this.num_bits = this.addrMenuNode.value;
        this.len_address = (1 << this.num_bits)
        this.address_eg = "";
        for (let i = 0; i < this.num_bits; i++) {
            let curr_rand = Math.random();
            if (curr_rand < 0.5) {
                this.address_eg += "0";
            } else {
                this.address_eg += "1";
            }
        }
        var rand_list = [1,2,1];
        for (let i = 0; i < (this.num_bits - 4); i++){
            let curr_rand = Math.random();
            if (curr_rand < 0.34) {
                rand_list[0] += 1;
            } else if (curr_rand < 0.67) {
                rand_list[1] += 1;
            } else {
                rand_list[2] += 1;
            }
        }
        this.tag_bits = rand_list[0];
        this.index_bits = rand_list[1];
        this.offset_bits = rand_list[2];
        
        this.block_size = 1 << this.offset_bits;
        this.num_entry = 1 << this.index_bits;  
    }

    // generate the answer as a string based on the randomly generated number
    generateAnswer() {
        this.cache_org = this.orgMenuNode.value;
        this.feedbackDiv.style.visibility = 'hidden';
        // this.newInputNode.style.visibility = 'visible';
        this.questionPart.style.visibility = "visible";
        this.displayFeed = [];
        
        this.block_size_ans = this.block_size;
        this.entries_ans = this.num_entry;

        switch (this.cache_org) {
            case "Direct-Mapped" : 
                this.num_line_ans = 1<<(this.index_bits);
                this.question2.style.visibility = "hidden";
                break;
            case "2-Way Set Associative" : 
                this.num_line_ans = (this.entries_ans)*2;
                this.question2.style.visibility = "visible";
                break;
            case "4-Way Set Associative" : 
                this.num_line_ans = (this.entries_ans)*4;
                this.question2.style.visibility = "visible";
                break;
        }
        this.answers = [this.block_size_ans, this.entries_ans, this.num_line_ans];
        this.regeneratePrompt();
    }

    /*===================================
    === Checking/loading from storage ===
    ===================================*/
    restoreAnswers(data) {
        var arr;
        // Restore answers from storage retrieval done in RunestoneBase.
        try {
            // The newer format CacheInfoNodes data as a JSON object.
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
        // the answer is correct if each of the input field is the same as its corresponding target value
        this.correct = true;
        this.feedback_msg = [];
        for (var i = 0; i < 3; i ++ ) {
            if ( this.orgMenuNode.value === "Direct-Mapped" && i === 1) {
                continue;
            }
            var input_value = this.inputNodes[i].value;
            if ( input_value === "" ) {
                this.feedback_msg.push($.i18n("msg_no_answer"));
                this.correct = false;
                this.inputNodes[i].setAttribute("class", "alert alert-danger");
            } else if ( input_value != this.answers[i] ) {
                this.feedback_msg.push($.i18n("msg_cacheinfo_incorrect_"+i.toString()));
                this.correct = false;
                this.inputNodes[i].setAttribute("class", "alert alert-danger");            
            } else {
                this.feedback_msg.push($.i18n("msg_cacheinfo_correct"));
                this.inputNodes[i].setAttribute("class", "alert alert-info");
            }
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
        //         this.renderfeedback();
        //     }
        // }
        // return detail;
        this.renderfeedback();
        return data;
    }

    regeneratePrompt() {
        this.addressNodeAddress.textContent = this.address_eg;
        this.tagNodeTag.textContent = this.tag_bits;
        this.indexNodeIndex.textContent = this.index_bits;
        this.offsetNodeOffset.textContent = this.offset_bits;
    }

    /*==============================
    === Evaluation of answer and ===
    ===     display feedback     ===
    ==============================*/
    // Inputs:
    //
    // - Strings entered by the student in ``this.blankArray[i].value``.
    // - feedback in ``this.feedbackArray``.
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
    
    hidefeedback() {
        this.feedbackDiv.style.visibility = "hidden";
    }

    renderfeedback() {
        // only the feedback message needs to display
        var feedback_html = "";
        if ( this.orgMenuNode.value === "Direct-Mapped" ) {
            for ( var i = 0; i < 2; i ++ ) {
                feedback_html += "<dev>" + this.feedback_msg[i] + "</dev>";
                if ( i < 1 ) {
                    feedback_html += "<br/>";
                }
            }
        } else {
            for ( var i = 0; i < 3; i ++ ) {
                feedback_html += "<dev>" + this.feedback_msg[i] + "</dev>";
                if ( i < 2 ) {
                    feedback_html += "<br/>";
                }
            }
        }

        if (this.correct) {
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            $(this.feedbackDiv).attr("class", "alert alert-danger");
        }
        
        this.feedbackDiv.innerHTML = feedback_html;
        this.feedbackDiv.style.visibility = "visible";
        if (typeof MathJax !== "undefined") {
            this.queueMathJax(document.body);
        }
    }

    /*==================================
    === functions for compare button ===
    ==================================*/
    enableCompareButton() {
        this.compareButton.disabled = false;
    }
    // _`comparecacheinfoAnswers`
    compareCacheInfoAnswers() {
        var data = {};
        data.div_id = this.divid;
        data.course = eBookConfig.course;
        jQuery.get(
            `${eBookConfig.new_server_prefix}/assessment/gettop10Answers`,
            data,
            this.comparecacheinfo
        );
    }
    compareCacheInfo(data, status, whatever) {
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
    $("[data-component=cacheinfo]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                cacheinfoList[this.id] = new cacheinfo(opts);
            } catch (err) {
                console.log(
                    `Error rendering Cache Information Problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});
