// *********
// vmInfo.js
// *********
// This file contains the JS for the Runestone vmInfo component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/06/2023. 
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./vminfo-i18n.en.js";
import "../css/vminfo.css";
import { Pass } from "codemirror";

export var vmInfoList = {}; // Object containing all instances of vmInfo that aren't a child of a timed assessment.

// vmInfo constructor
export default class vmInfo extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;
        this.correct = null;
        // default number of bits = 4
        this.num_bits = 4;
        // keep track of the last generated cache combination and ensure
        // each time it generates a different combination
        this.last_rand_choice = [0,0,0];

        this.createvmInfoElement();
        this.caption = "Virtual Memory Information";
        this.addCaption("runestone");
        // this.checkServer("vmInfo", true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }
    }
    // Find the script tag containing JSON in a given root DOM node.
    scriptSelector(root_node) {
        return $(root_node).find(`script[type="application/json"]`);
    }
    /*===========================================
    ====   functions generating final HTML   ====
    ===========================================*/
    createvmInfoElement() {
        this.feedbackDiv = document.createElement("div");
        this.rendervmInfoInput();
        this.rendervmInfoButtons();
        this.rendervmInfofeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
        
    }

    rendervmInfoInput() {
        // Generate the drop-down menu for cache organization
        this.containerDiv = document.createElement("div");
        this.questionDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        // list of cache organization opitons
        // this.cacheOrgArray = ["Direct-Mapped", "2-Way Set Associative", "4-Way Set Associative"];

        // create the cache organization dropdown menu
        // this.orgMenuNode = document.createElement("select");
        // for (var i = 0; i < this.cacheOrgArray.length; i++) {
        //     var option = document.createElement("option");
        //     option.value = this.cacheOrgArray[i];  
        //     option.text = this.cacheOrgArray[i];
        //     this.orgMenuNode.appendChild(option);
        // }
        // this.orgMenuNode.setAttribute("class", "form form-control selectwidthauto");
        // this.orgMenuNode.addEventListener("change",
        //     function () {
        //         this.clearInput();
        //         this.generateAnswer();
        //     }.bind(this),
        //     false);

        // Generate the drop-down menu for address length
        // this.bitsLengthArray = ["4 bits", "8 bits", "16 bits"];
        
        // // create the menu node for address length
        // this.addrMenuNode = document.createElement("select");
        // for (var i = 0; i < this.bitsLengthArray.length; i++) {
        //     var option = document.createElement("option");
        //     option.value = this.bitsLengthArray[i];
        //     option.text = this.bitsLengthArray[i];
        //     this.addrMenuNode.appendChild(option);
        // }
        // this.addrMenuNode.setAttribute("class", "form form-control selectwidthauto");
        // // When the option fo addrMenuNode is changed, 
        // this.addrMenuNode.addEventListener("change",
        //     function () {
        //         this.updateNumBits();
        //         this.generateQuestion();
        //         this.clearInput();
        //         this.generateAnswer();
        //     }.bind(this),
            // false);
        
        // Question Display //
            // create the helper instruction
        this.helperDiv = document.createElement("div");
        this.helperDiv.innerHTML = "In this assignment, you will answer questions about sizes " +
        "of physical memory and virtual memory based on the configuration of virtual addresses, RAM size and page/frame size.";

            // create the address in the question prompt
        // this.addressNode = document.createElement("div");
        // this.addressNodeText = document.createTextNode("address: ");
        // this.addressNodeAddress = document.createElement("code");
        // this.addressNodeAddress.textContent = this.address_eg;
        // this.addressNode.appendChild(this.addressNodeText);
        // this.addressNode.appendChild(this.addressNodeAddress);
        // this.addressNode.style.textAlign = "center";
        // this.addressNode.style.fontSize = "x-large";
        
            // create the tag, index, and offset info in the question prompt
        this.partitionNode = document.createElement("div");
        this.bitNodeText = document.createTextNode("-bit virtual address");
        this.bitNodeBit = document.createElement("code");
        this.bitNodeBit.textContent = this.num_bits;
        this.frameNodeText = document.createTextNode(" frames of physical RAM");
        this.frameNodeFrame = document.createElement("code");
        this.frameNodeFrame.textContent = this.num_frames;
        this.blockNodeText = document.createTextNode("-byte page/frame size");
        this.blockNodeBlock = document.createElement("code");
        this.blockNodeBlock.textContent = this.block_size;
        this.partitionNode.appendChild(this.bitNodeBit);
        this.partitionNode.appendChild(this.bitNodeText);
        this.partitionNode.appendChild(document.createElement("br"));

        this.partitionNode.appendChild(this.frameNodeFrame);
        this.partitionNode.appendChild(this.frameNodeText);
        this.partitionNode.appendChild(document.createElement("br"));

        this.partitionNode.appendChild(this.blockNodeBlock);
        this.partitionNode.appendChild(this.blockNodeText);
        this.partitionNode.style.textAlign = "center";
        this.partitionNode.style.fontSize = "x-large";

            // create the menus and put the question prompt together
        this.statementDiv = document.createElement("div");
        this.statementDiv.appendChild(this.helperDiv);
        this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.appendChild(this.partitionNode);
        this.statementDiv.appendChild(document.createElement("br"));

        this.statementDiv.style.borderWidth = "1px";
        this.statementDiv.style.borderRadius = "5px";
        this.statementDiv.style.borderBlockStyle = "solid";
        this.statementDiv.style.borderBlockColor = "white";
        this.statementDiv.style.backgroundColor = "white";
        this.statementDiv.style.padding = "8px";

        this.containerDiv.appendChild(this.statementDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        
        // create answer field
        this.question1 = document.createElement("div");
        this.question1Prompt = document.createTextNode($.i18n("physical_memory") + "\t=\t");
        this.inputNode1 = document.createElement("input");
        this.question1.appendChild(this.question1Prompt);
        this.question1.appendChild(this.inputNode1);

        this.question2 = document.createElement("div");
        this.question2Prompt = document.createTextNode($.i18n("virtual_memory") + "\t=\t");
        this.inputNode2 = document.createElement("input");
        this.question2.appendChild(this.question2Prompt);
        this.question2.appendChild(this.inputNode2);

        // this.question3 = document.createElement("div");
        // this.question3Prompt = document.createTextNode($.i18n("num_lines") + "\t=\t");
        // this.inputNode3 = document.createElement("input");
        // this.question3.appendChild(this.question3Prompt);
        // this.question3.appendChild(this.inputNode3);

        this.inputNodes = [this.inputNode1, this.inputNode2];
        for (var i = 0; i<2; i++) {
            this.inputNodes[i].addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    this.submitButton.click();
                }
            }.bind(this), false);  
        }
        this.questionDiv.appendChild(this.question1);
        // this.questionDiv.appendChild(this.question3);
        this.questionDiv.appendChild(this.question2);
        this.containerDiv.appendChild(this.questionDiv);
        this.containerDiv.appendChild(document.createElement("br"));


        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);
        
        this.generateQuestion();
        this.generateAnswer();

        // Remove the script tag.
        this.scriptSelector(this.containerDiv).remove();
        // Set the class for the text inputs, then store references to them.
        let ba = $(this.containerDiv).find("input");
        ba.attr("class", "form form-control selectwidthauto");
        ba.attr("aria-label", "input area");
        ba.attr("type", "text");
        ba.attr("size", "10");
        ba.attr("maxlength", "10");
        ba.attr("placeholder", "your answer");
        
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

    rendervmInfoButtons() {
        // "check me" button and "generate a number" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_vminfo_check_me");
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
        this.generateButton.textContent = $.i18n("msg_vminfo_generate_a_number");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "Generate an Address",
            type: "button",
        });
        this.generateButton.addEventListener(
            "click",
            function () {
                this.generateQuestion();
                this.clearInput();
                this.generateAnswer();
            }.bind(this),
            false)
        ;

        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);
    }
    
    rendervmInfofeedbackDiv() {
        this.feedbackDiv.id = this.divid + "_feedback";
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    // clear the input fields
    clearInput() {
        for ( var i = 0 ; i < 2; i ++ ) {
            this.inputNodes[i].value = "";
            // reset the style of each input field
            this.inputNodes[i].setAttribute("class", "form form-control selectwidthauto");
        }
    }

    // update this.num_bits based on this.addrMenuNode
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
    
    generateRandomInt(lower, upper) {
        return lower + Math.floor((upper - lower) * Math.random());
    }
    // generate a memory address
    generateQuestion() {
        this.num_bits = 1 << this.generateRandomInt(2,5);
        this.num_frames = 1 << this.generateRandomInt(1,5);
        this.block_size = 1 << this.generateRandomInt(1,5);

    }
    
    // check if the newly generated list is the same as the old one
    checkSameRandList() {
        for (let i = 0; i < 3; i++) {
            if (this.rand_list[i] != this.last_rand_choice[i]) {
                return false;
            }
        }
        return true;
    }
    
    genRandList() {
        this.rand_list = [1,1,1];
        for (let i = 0; i < this.num_bits-3; i++) {
            if ((this.num_bits > 4) && i == 0) {
                this.rand_list[1] += 1;
                continue;
            }
            let curr_rand = Math.random();
            if (curr_rand < 0.34) {
                this.rand_list[0] += 1;
            } else if (curr_rand < 0.67) {
                this.rand_list[1] += 1;
            } else {
                this.rand_list[2] += 1;
            }            
        }
    }

    // generate the answer as a string based on the randomly generated number
    generateAnswer() {
        this.hidefeedback();
        // this.newInputNode.style.visibility = 'visible';
        this.questionDiv.style.visibility = "visible";
        this.displayFeed = [];
        
        this.physical_memory_size = this.num_frames * this.block_size;
        this.virtual_memory_size = 1 << this.num_bits;
        
        // number of lines have something to do with the set associatives
        // switch (this.orgMenuNode.value) {
        //     case "Direct-Mapped" : 
        //         this.num_line_ans = this.entries_ans;
        //         this.question2.style.visibility = "hidden";
        //         break;
        //     case "2-Way Set Associative" : 
        //         this.num_line_ans = (this.entries_ans)*2;
        //         this.question2.style.visibility = "visible";
        //         break;
        //     case "4-Way Set Associative" : 
        //         this.num_line_ans = (this.entries_ans)*4;
        //         this.question2.style.visibility = "visible";
        //         break;
        // }
        this.answers = [this.physical_memory_size, this.virtual_memory_size];
        this.generatePrompt();
    }

    /*===================================
    === Checking/loading from storage ===
    ===================================*/
    restoreAnswers(data) {
        // pass
    }
    checkLocalStorage() {
        // pass
    }
    setLocalStorage(data) {
        // pass
    }
    
    // check if the answer is correct
    checkCurrentAnswer() {
        // the answer is correct if each of the input field is the same as its corresponding value in this.answers
        this.correct = true;
        this.feedback_msg = [];
        for (var i = 0; i < 2; i ++ ) {
            // skip the question for number of sets when in direct-mapped
            // if ( this.orgMenuNode.value === "Direct-Mapped" && i === 1) {
            //     continue;
            // }
            var input_value = this.inputNodes[i].value;
            if ( input_value === "" ) {
                this.feedback_msg.push($.i18n("msg_no_answer"));
                this.correct = false;
                // change the style of input field to alert-danger when no answer provided
                this.inputNodes[i].setAttribute("class", "alert alert-danger");
            } else if ( input_value != this.answers[i] ) {
                this.feedback_msg.push($.i18n("msg_vminfo_incorrect_"+i.toString()));
                this.correct = false;
                // change the style of input field to alert-danger when the answer is wrong
                this.inputNodes[i].setAttribute("class", "alert alert-danger");            
            } else {
                this.feedback_msg.push($.i18n("msg_vminfo_correct"));
                // 
                this.inputNodes[i].setAttribute("class", "alert alert-info");
            }
        }
    }

    async logCurrentAnswer(sid) {
        let answer = JSON.stringify(this.inputNodes);
        // Save the answer locally.
        let feedback = true;
        this.setLocalStorage({
            answer: answer,
            timestamp: new Date(),
        });
        let data = {
            event: "vmInfo",
            act: answer || "",
            answer: answer || "",
            correct: this.correct ? "T" : "F",
            div_id: this.divid,
        };
        if (typeof sid !== "undefined") {
            data.sid = sid;
            feedback = false;
        }
        
        this.renderfeedback();
        return data;
    }

    // update the prompt
    generatePrompt() {
        this.bitNodeBit.textContent = this.num_bits;
        this.frameNodeFrame.textContent = this.num_frames;
        this.blockNodeBlock.textContent = this.block_size;
    }

    hidefeedback() {
        this.feedbackDiv.style.visibility = "hidden";
    }

    displayfeedback() {
        this.feedbackDiv.style.visibility = "visible";
    }

    renderfeedback() {
        // only the feedback message needs to display
        var feedback_html = "";
        // only two lines of feedback for direct-mapped
        for ( var i = 0; i < 2; i ++ ) {
            feedback_html += "<dev>" + this.feedback_msg[i] + "</dev>";
            if ( i < 1 ) {
                feedback_html += "<br/>";
            }
        }
        // otherwise, display 3 lines of feedback

        if (this.correct) {
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            $(this.feedbackDiv).attr("class", "alert alert-danger");
        }
        
        this.feedbackDiv.innerHTML = feedback_html;
        this.displayfeedback();
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
    $("[data-component=vminfo]").each(function (index) {
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                vmInfoList[this.id] = new vmInfo(opts);
            } catch (err) {
                console.log(
                    `Error rendering Cache Information Problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});
