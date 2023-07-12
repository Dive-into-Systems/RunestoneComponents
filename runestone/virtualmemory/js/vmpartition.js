// *********
// vmpartition.js
// *********
// This file contains the JS for the Runestone vmpartition component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/06/2023. 
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./vmpartition-i18n.en.js";
import "../css/vmpartition.css";
import { Pass } from "codemirror";

export var vmpartitionList = {}; // Object containing all instances of vmpartition that aren't a child of a timed assessment.

// vmpartition constructor
export default class vmpartition extends RunestoneBase {
    constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;
        this.correct = null;
        // default number of bits = 4
        // this.num_bits = 4;
        // keep track of the last generated cache combination and ensure
        // each time it generates a different combination
        this.last_rand_choice = [0,0,0];

        this.createCachePartitionElement();
        this.caption = "Cache Partition";
        this.addCaption("runestone");
        // this.checkServer("vmpartition", true);
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
    createCachePartitionElement() {
        this.feedbackDiv = document.createElement("div");
        this.renderCachePartitionInput();
        this.renderCachePartitionButtons();
        this.renderCachePartitionfeedbackDiv();
        // replaces the intermediate HTML for this component with the rendered HTML of this component
        $(this.origElem).replaceWith(this.containerDiv);
        
    }
    renderCachePartitionInput() {
        // Generate the drop-down menu for cache organization
        this.containerDiv = document.createElement("div");
        // this.questionDiv = document.createElement("div");
        this.containerDiv.id = this.divid;

        // Generate the drop-down menu for address length
        this.bitsLengthArray = ["4 bits", "8 bits", "16 bits"];

        // create the section that prompts question
        // create question prompt (address)
        this.addressNode = document.createElement("div");
        this.addressNodeText = document.createTextNode("address: 0b ");
        this.addressNodeAddress = document.createElement("div");
        this.addressNode.appendChild(this.addressNodeAddress);
        this.addressNode.style.textAlign = "center";
        this.addressNode.style.fontSize = "x-large";

        // create help text
        this.helperDiv = document.createElement("div");
        this.instructionText = document.createTextNode("Select the offset bits of the memory address.");
        this.helperDiv.appendChild(this.instructionText);
        this.helperDiv.appendChild(document.createElement("br"));
        this.usageText = document.createTextNode("Usage: click and drag through the address bits and highlight them with the button below.");
        this.helperDiv.appendChild(this.usageText);
        // create question prompt (block size, total number of lines)
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
        
        // put all question prompt segements together
        this.statementDiv = document.createElement("div");
        this.statementDiv.appendChild(this.helperDiv);
        this.statementDiv.appendChild(document.createElement("br"));
        // this.statementDiv.appendChild(document.createElement("br"));
        // this.statementDiv.append("Cache Organization: ");
        // this.statementDiv.appendChild(this.orgMenuNode);
        // this.statementDiv.append("Address Length: ");
        // this.statementDiv.appendChild(this.addrMenuNode);
        // this.statementDiv.appendChild(document.createElement("br"));
        // this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.appendChild(this.partitionNode);
        this.statementDiv.appendChild(document.createElement("br"));
        
        // set question prompt apart from the rest by a white background
        this.statementDiv.style.borderWidth = "1px";
        this.statementDiv.style.borderRadius = "5px";
        this.statementDiv.style.borderBlockStyle = "solid";
        this.statementDiv.style.borderBlockColor = "White";
        this.statementDiv.style.backgroundColor = "White";
        this.statementDiv.style.padding = "8px";

        // create selected bits display section
        var spaceNode = document.createTextNode("  ");
        this.inputBitsDiv = document.createElement("div");
        this.input_index_text = document.createTextNode("Your current index bits: ");
        this.input_index_count = document.createElement("code");
        this.input_index_count.textContent = "0";
        this.input_offset_text = document.createTextNode("Your current offset bits: ");
        this.input_offset_count = document.createElement("code");
        this.input_offset_count.textContent = "0";
        this.inputBitsDiv.appendChild(this.input_index_text);
        this.inputBitsDiv.appendChild(this.input_index_count);
        this.inputBitsDiv.appendChild(spaceNode);
        this.inputBitsDiv.appendChild(this.input_offset_text);
        this.inputBitsDiv.appendChild(this.input_offset_count);
        this.inputBitsDiv.style.textAlign = "center";

        this.containerDiv.appendChild(this.statementDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.addressNode);
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.inputBitsDiv);
        // this.containerDiv.appendChild(document.createElement("br"));


        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);
        
        
        this.generateAnswer();
        this.generateAddress();
        this.generatePrompt();

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

    renderCachePartitionButtons() {
        // "check me" button and "generate a number" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_vmpartition_check_me");
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
        this.generateButton.textContent = $.i18n("msg_vmpartition_generate_a_number");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "Generate Another",
            type: "button",
        });
        this.generateButton.addEventListener(
            "click",
            function () {
                this.generateAnswer();
                this.generateAddress();
                this.generatePrompt();
                this.resetHighlight();
            }.bind(this),
            false)
        ;
        
        // render the "set tag", "set index", "set offset", "reset" buttons
        this.questionButtionDiv = document.createElement("div");
        
        this.offsetButton = document.createElement("button");
        this.offsetButton.textContent = $.i18n("Set to Offset");
        $(this.offsetButton).attr({
            class: "btn btn-warning",
            name: "Select Offset",
            type: "button",
        });
        this.offsetButton.addEventListener(
            "click",
            function () {
                this.highlightSelectedOffset();
                this.currInputBits();
                this.hidefeedback();
            }.bind(this),
            false);
        
        this.resetButton = document.createElement("button");
        this.resetButton.textContent = $.i18n("Reset selection");
        $(this.resetButton).attr({
            class: "btn",
            name: "reset selection",
            type: "button",
        });
        this.resetButton.addEventListener(
            "click",
            function () {
                this.resetHighlight();
                this.currInputBits();
                this.hidefeedback(); 
            }.bind(this),
            false);
        // this.questionButtionDiv.appendChild(this.indexButton);
        this.questionButtionDiv.appendChild(this.offsetButton);
        this.questionButtionDiv.appendChild(this.resetButton);
        this.questionButtionDiv.style.textAlign = "center";
        
        // put all buttons together
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.questionButtionDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.generateButton);
        this.containerDiv.appendChild(this.submitButton);
    }
    
    renderCachePartitionfeedbackDiv() {
        this.feedbackDiv.id = this.divid + "_feedback";
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.feedbackDiv);
    }

    
    // generate a random memory address
    generateAddress() {
        this.len_address = (1 << this.num_bits);
        // store the memory address as an array of code bits 
        this.address_node_list = [];
        var codeNode = null;
        for (let i = 0; i < this.num_bits; i++) {
            let curr_rand = Math.random();
            if (curr_rand < 0.5) {
                codeNode = document.createElement("code");
                codeNode.textContent = "0";
                codeNode.className = "notselected";
                this.address_node_list.push(codeNode);
            } else {
                codeNode = document.createElement("code");
                codeNode.textContent = "1";
                codeNode.className = "notselected";
                this.address_node_list.push(codeNode);
            }
        }
        
    }
    
    // set the selected bits in the memory address into corresponding colors of index
    highlightSelectedIndex() {
        let selection = window.getSelection();
        for ( var i = 0 ; i < this.num_bits; i ++ ) {
            if (selection.containsNode( this.address_node_list[ i ], true ) ) {
                (this.address_node_list[ i ]).className = "indexclass";
            }
        }
    }
    // set the selected bits in the memory address into corresponding colors of offset
    highlightSelectedOffset() {
        let selection = window.getSelection();
        for ( var i = 0 ; i < this.num_bits; i ++ ) {
            if (selection.containsNode( this.address_node_list[ i ], true ) ) {
                (this.address_node_list[ i ]).className = "offsetclass";
            }
        }
    }
    //reset all selection, clear all colors
    resetHighlight() {
        this.address_node_list.forEach(
            element => element.className = "notselected"
        );
    }
    // generate the answer as a string based on the randomly generated number
    generateAnswer() {

        this.hidefeedback();
        // this.block_size_ans = this.block_size;
        // this.entries_ans = this.page_entry;
        this.num_bits = 1 << this.generateRandomInt(2, 5);
        this.num_frames = 1 << this.generateRandomInt(2,4);
        this.num_offset = this.generateRandomInt(1, this.num_bits);
        this.block_size = 1 << this.num_offset;
        this.index_bits = this.num_bits - this.num_offset;

        this.bitNodeBit.textContent = this.num_bits;
        this.frameNodeFrame.textContent = this.num_frames;
        this.blockNodeBlock.textContent = this.block_size;
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
        this.correct = true
        for (let i = 0; i < (this.index_bits); i++) {
            if (this.address_node_list[i].className == "offsetclass") {
                this.correct = false;
                console.log(i);
                return;
            }
        }
        for (let i = (this.index_bits); i < this.num_bits; i++) {
            if (this.address_node_list[i].className != "offsetclass") {
                this.correct = false;
                console.log(i);
                return;
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
            event: "vmpartition",
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
    
    /**
     * Calculates and display the number of bits for index and offset correspondingly
     */
    currInputBits() {
        this.input_index_bits = 0;
        this.input_offset_bits = 0;
        for (let i = 0; i < this.num_bits; i++) {
            if (this.address_node_list[i].className == "offsetclass") {
                this.input_offset_bits += 1;
            }
        }
        this.input_index_bits = this.num_bits - this.input_offset_bits;
        this.input_index_count.textContent = this.input_index_bits.toString();
        this.input_offset_count.textContent = this.input_offset_bits.toString();
    }

    // update the address to display
    updateDisplayedAddress() {
        var breakNode = null;
        this.addressNodeAddress.innerHTML = "";
        this.addressNodeAddress.appendChild(this.addressNodeText);
        for ( var i = 0 ; i < this.num_bits ; i ++ ) {
            this.address_node_list[ i ].style.fontSize = "x-large";
            this.addressNodeAddress.appendChild(this.address_node_list[ i ]);
            // insert an empty node between neighboring two bit nodes
            if ( i != this.num_bits - 1 ) {
                breakNode = document.createElement("code");
                breakNode.setAttribute("class", "prevent-select");
                breakNode.style.fontSize = "x-large";
                this.addressNodeAddress.appendChild(breakNode);
            }
        }
    }
    // update the prompt
    generatePrompt() {
        this.updateDisplayedAddress();
    }

    hidefeedback() {
        this.feedbackDiv.style.visibility = "hidden";
    }

    displayfeedback() {
        this.feedbackDiv.style.visibility = "visible";
    }

    generateRandomInt(lower, upper) {
        return lower + Math.floor((upper - lower) * Math.random());
    }

    renderfeedback() {
        // only the feedback message needs to display
        var feedback_html = "";

        if (this.correct) {
            feedback_html += "<div>" + $.i18n("msg_vmpartition_correct") + "</div>";
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            feedback_html += "<div>" + $.i18n("msg_vmpartition_incorrect") + "</div>";
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
    $("[data-component=vmpartition]").each(function (index) { 
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                vmpartitionList[this.id] = new vmpartition(opts);
            } catch (err) {
                console.log(
                    `Error rendering Cache Information Problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});
