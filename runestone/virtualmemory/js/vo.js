// *********
// vo.js
// *********
// This file contains the JS for the Runestone virtual memory component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/01/2023
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./vo-i18n.en.js";
import "../css/vo.css";
import { Pass } from "codemirror";

export var VOList = {}; // Object containing all instances of VO that aren't a child of a timed assessment.

// VO constructor
export default class VO extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;

        this.createVOElement();
        this.caption = "Virtual Memory Operations";
        this.addCaption("runestone");
        // this.checkServer("vo", true);
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
    // Create the VO Element
    createVOElement() {
        this.initParams(); // init all 
        this.renderVOInputField();
        this.renderVOButtons();
        this.renderVOFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

    initParams() {
        this.memoryAccess_chance = 0.3; // probability of memory-accessing ops in one set
        this.constantInArthm_chance = 0.5; // probability of having a contant as src
        this.num_q_in_group = 4; // number of questions in a group
        // declare all elements that could appear in the prompt
        this.arthm_operators = ["addl", "subl", "imull", "sall", "sarl", "shrl", "xorl", "andl", "orl", "leal"];
        this.registers = ["%eax", "%ecx", "%edx", "%ebx", "%esi", "%edi"];
        this.constRange = 11; // value range of the constants
        this.fieldList = ["Page fault? ", "Cache miss? ", "Dirty bit? "];
        this.fieldID = ["pf", "cm", "db"];
        this.promptList = [];
        this.answerList = [];
    }

    renderVOInputField() {
        this.feedbackDiv = document.createElement("div");
        this.feedbackDiv = $("<div>").attr("id", this.divid + "_feedback");

        this.containerDiv = $("<div>").attr("id", this.divid);
        this.instruction = $("<div>").html(
            "For each of the following IA32 instructions, indicate whether the instruction " + 
            "<b>could</b> cause a page fault, whether it <b>could</b> cause a cache miss, and " + 
            "whether it <b>could</b> cause the dirty bit in the cache to be set to 1."
        );
        this.statementDiv = $("<div>").append(this.instruction);
        this.statementDiv.append("<br>");
        this.inputBox = document.createElement("div");
        // convert inputBox to a jQuery object
        this.inputBox = $(this.inputBox);

        this.textNodes = []; // create a reference to all current textNodes for future update
        this.inputNodes = [];
        var textNode = null;
        
        this.genPromptsNAnswer();
        // create and render all input fields in question group
        for (let i = 0; i < this.num_q_in_group; i++) {
            this.divID = "div" + i;
            this.newDiv = $("<div>").attr("id", this.divID);
            this.newDiv.append(String.fromCharCode(i + 97) + ". "); // bulletin for each question
            
            textNode = $(document.createElement("code")).text(this.promptList[i]); // create the prompt
            textNode.css("font-size", "large");
            this.textNodes.push(textNode);
            this.newDiv.append(textNode);

            this.radioButtons = [];

            this.newDiv.append("<br>");

            // create and render page fault, cache miss, dirty bit answer fields
            for (let j = 0; j < 3; j++) {
                this.newDiv.append(this.fieldList[j]);
                // create labels and buttons for YES and NO
                var lblYes = $("<label>").text("YES");
                var btnYes = $("<input>").attr({
                    type: "radio",
                    value: true,
                    name: "YN" + i + this.fieldID[j],
                    id: "Yes" + i + this.fieldID[j]
                });
                btnYes.on('change', function () {
                    $(this).removeClass('highlightWrong');
                    $(this).next('label').removeClass('highlightWrong');
                });
                var lblNo = $("<label>").text("NO");
                var btnNo = $("<input>").attr({
                    type: "radio",
                    value: false,
                    name: "YN" + i + this.fieldID[j],
                    id: "No" + i + this.fieldID[j]
                });
                btnNo.on('change', function () {
                    $(this).removeClass('highlightWrong');
                    $(this).prev('label').removeClass('highlightWrong');
                });
                this.newDiv.append(lblYes);
                this.newDiv.append(btnYes);
                this.newDiv.append(lblNo);
                this.newDiv.append(btnNo);
                if (j !== 2) { 
                    this.newDiv.append(" | ");
                    this.newDiv.append(document.createTextNode( '\u00A0' ));
                }
                this.radioButtons.push([btnYes, btnNo]);
                
            }
            this.inputBox.append(this.newDiv);
            this.inputNodes.push(this.radioButtons);
        }
        this.statementDiv.append(this.inputBox);

        // copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);
        
        this.statementDiv.css({ // set style
            borderWidth: "1px",
            borderRadius: "5px",
            borderBlockStyle: "solid",
            borderBlockColor: "white",
            backgroundColor: "white",
            padding: "8px"
        });

        // remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
        // div structure: containerDiv consists of instruction, <br>, inputBox.
        // inputBox contains four newDiv 
        this.containerDiv.append(this.statementDiv);
    }

    genPromptsNAnswer() { // generates a group of prompts and their answers
        var arthOps = [
            [["arth", "const", "reg"], [false, false, false]],
            [["arth", "reg", "reg"], [false, false, false]],
            [["movl", "reg", "reg"],[false, false, false]],
            [["movl", "const", "reg"],[false, false, false]],
        ];
        var memAccess = [
            [["movl", "mem", "reg"], [true, true, false]],
            [["movl", "reg", "mem"], [true, true, true]],
            [["movl", "const", "mem"], [true, true, true]],
        ];
        var choice = [];

        for (let k = 0; k < this.num_q_in_group; k++) {
            if (Math.random() < this.memoryAccess_chance) {
                choice = this.pick(memAccess);
            } else {
                choice = this.pick(arthOps);
            }
            this.promptList[k] = choice[0];
            this.answerList[k] = choice[1];

            this.promptList[k] = this.renderOnePrompt(this.promptList[k]);
        }
    }

    renderOnePrompt(o) {
        var o1 = false;
        var o2 = false;

        if (o[0] === "arth") {
            o[0] = this.pick(this.arthm_operators);
            o[1] = (Math.random() < this.constantInArthm_chance) ? this.renderConstant() : this.pick(this.registers);
            
            o[2] = this.pick(this.registers);
            while (o[2] === o[1]) {
                o[2] = this.pick(this.registers);
            }
        }
        else {
            o[0] = "movl";
            if (o[1] === "const") {
                o[1] = this.renderConstant();
            } else if (o[1] === "mem") {
                o1 = true;
                o[1] = this.pick(this.registers);
            } else {
                o[1] = this.pick(this.registers);
            }

            if (o[2] === "mem") {
                o2 = true;
            }
            o[2] = this.pick(this.registers);
            while (o[2] === o[1]) {
                o[2] = this.pick(this.registers);
            }

            if (o1) {
                o[1] = "(" + o[1] + ")";
            }
            if (o2) {
                o[2] = "(" + o[2] + ")";
            }
        }
        return o[0] + " " + o[1] + ", " + o[2];
    }

    renderVOButtons() {
        // "check me" button and "generate a number" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_VO_check_me");
        $(this.submitButton).attr({
            class: "btn btn-success",
            name: "answer",
            type: "button",
        });
        // check the answer when the conversion is valid
        this.submitButton.addEventListener("click",
            function () {
                this.checkAllAnswers();
                this.logCurrentAnswer();
            }.bind(this),
            false
        );

        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_VO_generate_another");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a number",
            type: "button",
        });
        this.generateButton.addEventListener("click", () => {
            // clear answers in input fields
            this.clearAllAnswer();
            // update the inputBox with four more new options
            this.updatePrompts();
          });

        this.redoButton = document.createElement("button");
        this.redoButton.textContent = $.i18n("msg_VO_redo");
        $(this.redoButton).attr({
            class: "btn btn-success",
            name: "answer",
            type: "button",
        });
        // check the answer when the conversion is valid
        this.redoButton.addEventListener("click",
            function () {
                this.clearAllAnswer();
                // pass just for now
            }.bind(this),
            false
        );

        this.containerDiv.append("<br>");
        this.containerDiv.append(this.generateButton);
        this.containerDiv.append(this.redoButton);
        this.containerDiv.append(this.submitButton);
    }

        
    updatePrompts(){
        // get new prompts and answers
        this.genPromptsNAnswer();

        // create and render all input fields in question group
        for (let i = 0; i < this.num_q_in_group; i++) {
            this.textNodes[i].text(this.promptList[i]);
        }
    }

    checkAllAnswers() {
        this.feedback_msg = []; // clear feedback_msg
        this.correct = true; // init answer first as true, only update when incorrect choice occurs
        this.wrongPF = false; // init all answer as correct
        this.wrongCM = false; // init all answer as correct
        this.wrongDB = false; // init all answer as correct
        this.incompleteAnswer = false;

        for (let i = 0; i < this.num_q_in_group; i++) {
            const checkedAnswerInOneGroup = []
            for (let j = 0; j < 3; j++) {
                if (this.inputNodes[i][j][0].is(":checked")) { // when user chose YES
                    checkedAnswerInOneGroup.push(true);
                } else if (this.inputNodes[i][j][1].is(":checked")) { // when user chose NO
                    checkedAnswerInOneGroup.push(false);
                } else { // when user chose nothing
                    checkedAnswerInOneGroup.push("");
                    this.correct = false;
                    this.incompleteAnswer = true;
                    break;
                }
                if ((checkedAnswerInOneGroup[j] !== this.answerList[i][j])) {
                    var btnName = 'YN' + i + this.fieldID[j];
                    $('input[type="radio"][name="' + btnName + '"]').addClass('highlightWrong');
                    this.correct = false;
                    if (j === 0) {
                        this.wrongPF = true;
                    }
                    if (j === 1) {
                        this.wrongCM = true;
                    } 
                    if (j === 2) {
                        this.wrongDB = true;
                    }
                }
            }
        }
        
        if (this.correct === false) {
            if (this.incompleteAnswer === true) {
                this.feedback_msg.push($.i18n("msg_VO_imcomplete_answer"));
            } else {
                if (this.wrongPF === true) {
                    this.feedback_msg.push($.i18n("msg_VO_wrong_pf"));
                }
                if (this.wrongCM === true) {
                    this.feedback_msg.push($.i18n("msg_VO_wrong_cm"));
                }
                if (this.wrongDB === true) {
                    this.feedback_msg.push($.i18n("msg_VO_wrong_db"));
                }
            }
        } else {
            this.feedback_msg.push($.i18n("msg_VO_correct"));
        }

        this.renderFeedback();
    }

    /// *** HELPER FUNCTIONS *** ///
    renderVOFeedbackDiv() {
        this.containerDiv.append("<br>");
        this.containerDiv.append(this.feedbackDiv);
    }

    clearAllAnswer() { // clear all selection
        $('input[type="radio"]').prop('checked', false);
    }

    recordAnswered() {
        this.isAnswered = true;
    }

    renderConstant() { // generate a value within constRange and prime it for display
        return "$" + (Math.floor(Math.random() * this.constRange)).toString();
    }

    pick(myList) { // randomly pick one item in list
        const randIdx = Math.floor(Math.random() * (myList.length));
        return myList[randIdx];
    }

    // log the answer and other info to the server (in the future)
    async logCurrentAnswer(sid) {
        let answer = JSON.stringify(this.inputNodes);
        let feedback = true;
        // Save the answer locally.
        this.setLocalStorage({
            answer: answer,
            timestamp: new Date(),
        });
        let data = {
            event: "vo",
            act: answer || "",
            answer: answer || "",
            correct: this.correct ? "T" : "F",
            div_id: this.divid,
        };
        if (typeof sid !== "undefined") {
            data.sid = sid;
            feedback = false;
        }
        // render the feedback
        this.renderFeedback();
        return data;
    }

    /*===================================
    === Checking/loading from storage ===
    ===================================*/
    // Note: they are not needed here
    restoreAnswers(data) {
        // pass
    }
    checkLocalStorage() {
        // pass
    }
    setLocalStorage(data) {
        // pass
    }
    
    hideFeedback() {
        $(this.feedbackDiv).css("visibility", "hidden");
    }

    displayFeedback() {
        $(this.feedbackDiv).css("visibility", "visible");;
    }

    renderFeedback() {
        var l = this.feedback_msg.length;
        var feedback_html = "";

        for (let i = 0; i < l; i++) {
            feedback_html += "<dev>" + this.feedback_msg[i] + "</dev>";
            if (i < (this.feedback_msg.length - 1)) {
                feedback_html += "<br/>";
            }
        }

        if (this.correct === true) {
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            $(this.feedbackDiv).attr("class", "alert alert-danger");
        }
        
        this.feedbackDiv.html(feedback_html);
        this.displayFeedback();
        
        if (typeof MathJax !== "undefined") {
            this.queueMathJax(document.body);
        }
    }
}

/*=================================
== Find the custom HTML tags and ==
==   execute our code on them    ==
=================================*/
$(document).on("runestone:login-complete", function () {
    $("[data-component=vo]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                VOList[this.id] = new VO(opts);
            } catch (err) {
                console.log(
                    `Error rendering Virtual Memory Operations Problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});
