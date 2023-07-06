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

        // init default set-up
        this.correct = null;
        this.memoryAccess = 2; // number of memory-accessing ops in one set
        this.num_q_in_group = 4; // number of questions in a group
        // declare all elements that could appear in the prompt
        this.ops = ["addl", "subl", "imull", "sall", "sarl", "shrl", "xorl", "andl", "orl", "leal", "movl"];
        this.registers = ["%eax", "%ecx", "%edx", "%ebx", "%esi", "%edi"];
        this.range = 11; // value range of the constants
        
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
        this.renderVOInputField();
        this.renderVOButtons();
        //this.renderVOFeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
    }

    renderVOInputField() {
        this.containerDiv = $("<div>").attr("id", this.divid);
        this.instruction = $("<div>").html(
            "For each of the following IA32 instructions, indicate whether the instruction " + 
            "<b>could</b> cause a page fault, whether it <b>could</b> cause a cache miss, and " + 
            "whether it <b>could</b> cause the dirty bit in the cache to be set to 1."
        );
        this.statementDiv = $("<div>").append(this.instruction);
        this.containerDiv.append(this.statementDiv);
        
        var answerList = this.genAnswerList();
        var promptList = this.genPrompts();

        this.fieldList = ["Page fault? ", "Cache miss? ", "Dirty bit? "];
        this.shorthandList = ["pf", "cm", "db"];
        var blankLine = $("<div>").css("height", "20px"); // not working somehow? =^owo^=

        for (let i = 0; i < this.num_q_in_group; i++) {
            var divID = "div" + i;
            var newDiv = $("<div>").attr("id", divID);
            var title =  String.fromCharCode(i + 97);
            newDiv.append(title + ". " + this.renderOnePrompt(promptList[i]) + "<br>");

            for (let j = 0; j < 3; j++) {
                newDiv.append(this.fieldList[j]);
                // create labels and button for YES and NO
                var lblYes = $("<label>").text("YES");
                var btnYes = $("<input>").attr({
                    type: "radio",
                    value: "Y",
                    name: "YN" + i + this.shorthandList[j],
                    id: "Yes" + i + this.shorthandList[j]
                });
                var lblNo = $("<label>").text("NO");
                var btnNo = $("<input>").attr({
                    type: "radio",
                    value: "N",
                    name: "YN" + i + this.shorthandList[j],
                    id: "No" + i + this.shorthandList[j]
                });
                newDiv.append(lblYes);
                newDiv.append(btnYes);
                newDiv.append(lblNo);
                newDiv.append(btnNo);
            }
            this.statementDiv.append(newDiv);
        }

        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);
        
        this.statementDiv.css({
            borderWidth: "1px",
            borderRadius: "5px",
            borderBlockStyle: "solid",
            borderBlockColor: "white",
            backgroundColor: "white",
            padding: "8px"
        });

        // Remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
    }

    renderOnePrompt(operation) {
        return operation[0] + " " + operation[1] + ", " + operation[2];
        // console.log(operation[0] + " " + operation[1] + ", " + operation[2]);
    }

    genPrompts() {
        // const promptList = []
        // for (let i = 0; i < this.num_q_in_group; i++) {
        //     const randIdx = Math.floor(this.ops.length);
        //     var operator = this.ops[randIdx];
        //     randIdx = Math.floor(this.resgisters.length);
        //     var dest = this.resgisters[randIdx];
        //     randIdx = Math.floor(this.resgisters.length);
        //     var src = this.resgisters[randIdx];
        //     promptList[i] = [operator, src, dest];
        // }
        // console.log(promptList);
        // return promptList;
        return [["movl", "$5", "(%eax)"], ["movl", "$6", "(%ebx)"], ["movl", "$7", "(%ecx)"], ["movl", "$8", "(%edx)"]];
    }

    genAnswerList(promptList) {
        return [false, false, false, false];
    }

    recordAnswered() {
        this.isAnswered = true;
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
        // this.submitButton.addEventListener("click",
        //     function () {
        //         this.checkThisAnswer();
        //         this.logCurrentAnswer();
        //     }.bind(this),
        //     false
        // );

        this.generateButton = document.createElement("button");
        this.generateButton.textContent = $.i18n("msg_VO_generate_another");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "generate a number",
            type: "button",
        });
        // haven't finished this
        // this.generateButton.addEventListener("click",
        //     function () {
        //         this.clearAnswer();
        //         // this.generateNumber();
        //         // this.generateAnswer();
        //     }.bind(this),
        //     false
        // );

        this.containerDiv.append("<br>");
        this.containerDiv.append(this.generateButton);
        this.containerDiv.append(this.submitButton);

        // this.inputNode.addEventListener(
        //     "keypress",
        //     function(event) {
        //     if (event.key === "Enter") {
        //             this.submitButton.click();
        //         }
        //     }.bind(this), false
        //     );
    }

    renderVOFeedbackDiv() {
        this.feedBackDiv = document.createElement("div");
        this.feedBackDiv.id = this.divid + "_feedback";
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedBackDiv);
    }

    // clear the input field
    clearAnswer() {
        this.inputNode.value = "";
    }

    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

    // generate a random number from 0 to 2^(this.num_bits)-1 and set the number to display
    generateNumber() {
        var randVal = getRandomInt(0, this.range);
        return "$" + randVal; 
    }

    // generate the answer as a string based on the randomly generated number
    generateAnswer() {

        this.inputNode.style.visibility = 'visible';
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
        // update the prompt
        this.generatePrompt();
    }

    
    generatePrompt() {
        
        this.inputNode.style.visibility = 'visible';
        // switch(this.menuNode1.value) {
        //     case "binary" : 
        //         this.promptDivTextNode.textContent = "0b" + this.displayed_num_string + " = ";
        //         break;
        //     case "decimal-unsigned" : 
        //         this.promptDivTextNode.textContent = this.displayed_num_string + " = ";
        //         break;
        //     case "decimal-signed" : 
        //         this.promptDivTextNode.textContent = this.displayed_num_string + " = ";
        //         break;
        //     case "hexadecimal" : 
        //         this.promptDivTextNode.textContent = "0x" + this.displayed_num_string + " = ";
        //         break;           
        // }

        // // the placeholder tells what the desired input should be like
        // var placeholder;
        // switch(this.menuNode2.value) {
        //     case "binary" : 
        //         this.promptDivTextNode.append("0b");
        //         placeholder = "your answer (" + this.num_bits.toString() + "-digit binary value)";
        //         break;
        //     case "decimal-unsigned" : 
        //         placeholder = "your answer (unsigend decimal)";
        //         break;
        //     case "decimal-signed" : 
        //         placeholder = "your answer (signed decimal)";
        //         break;
        //     case "hexadecimal" : 
        //         this.promptDivTextNode.append("0x");
        //         placeholder = "your answer (" + this.num_bits.toString() + "-digit hexadecimal value)";
        //         break;           
        // }
        // this.inputNode.setAttribute("placeholder", placeholder);
        // this.inputNode.setAttribute("size", placeholder.length);
        // this.inputNode.setAttribute("maxlength", 1+this.num_bits);
        // this.hideFeedback();
    }

    // check if the prompt is valid, so actually only 
    isValidPrompt(currPrompt) {
        var isValid = true;
        if (currPrompt[1].access === true && currPrompt[2].access === true) {
            isValid = false;
        } else if (currPrompt[0].arth === true && (currPrompt[1].access === true || currPrompt[2].access === true)) {
            isValid = false;
        }
        return isValid;
    }

    // // check if the conversion is valid  
    // checkValidConversion() {
    //     this.valid_conversion = true;
    //     // a conversion is valid when two types are different
    //     if (this.menuNode1.value === this.menuNode2.value) {
    //         this.valid_conversion = false;
    //         this.correct = false;
    //         this.feedback_msg = ($.i18n("msg_VO_same_exp"));
    //         this.renderFeedback();
    //         this.inputNode.style.visibility = "hidden";
    //         this.promptDivTextNode.textContent = "";
    //     // if one of the option is signed decimal, then the other
    //     // option must be binary
    //     } else if ((this.menuNode1.value === "decimal-signed" 
    //             && this.menuNode2.value != "binary") 
    //             || (this.menuNode2.value === "decimal-signed" 
    //             && this.menuNode1.value != "binary")) 
    //         {
    //         this.valid_conversion = false;
    //         this.correct = false;
    //         this.feedback_msg = ($.i18n("msg_VO_two02dec"));
    //         this.renderFeedback();
    //         this.inputNode.style.visibility = 'hidden';
    //         this.promptDivTextNode.textContent = "";
    //         return;
    //     } else {
    //         this.promptDiv.style.visibility = "visible";
    //     }
    // }
    
    checkThisAnswer(i, j, answerList) {
        var isYes = $("#" + "Yes" + i + this.shorthandList[j]).is(":checked");
        var isNo = $("#" + "No" + i + this.shorthandList[j]).is(":checked");
        try {
            if (1) { // if pf selection is incorrect
                console.log("if pf selection is incorrect");
            }
            if (1) { // if cm selection is incorrect
                console.log("if cm selection is incorrect");
            }
            if (1) { // if db selection is incorrect
                console.log("if db selection is incorrect");
            }
        }
        catch {
            this.feedBackWrongAnswer = $.i18n("msg_VO_incomplete_answer");
            this.correct = false;
            console.log(error);
        }
    }

    // log the answer and other info to the server (in the future)
    async logCurrentAnswer(sid) {
        let answer = JSON.stringify(this.inputNode.value);
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
        this.feedBackDiv.style.visibility = "hidden";
    }

    displayFeedback() {
        this.feedBackDiv.style.visibility = "visible";
    }

    renderFeedback() {
        // only the feedback message needs to display
        var feedback_html = "<dev>" + this.feedback_msg + "</dev>";
        if (this.correct) {
            $(this.feedBackDiv).attr("class", "alert alert-info");
        } else {
            $(this.feedBackDiv).attr("class", "alert alert-danger");
        }
        
        this.feedBackDiv.innerHTML = feedback_html;
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
