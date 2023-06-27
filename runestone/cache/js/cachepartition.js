// *********
// cachepartition.js
// *********
// This file contains the JS for the Runestone cachepartition component. It was created By Luyuan Fan, Zhengfei Li, and Yue Zhang, 06/06/2023. 
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import "./cache-i18n.en.js";
import "../css/cache.css";
import { Pass } from "codemirror";

export var cachepartitionList = {}; // Object containing all instances of cachepartition that aren't a child of a timed assessment.

// cachepartition constructor
export default class cachepartition extends RunestoneBase {
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

        this.createCachePartitionElement();
        this.caption = "Cache Partition";
        this.addCaption("runestone");
        // this.checkServer("cachepartition", true);
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

        // list of cache organization opitons
        this.cacheOrgArray = ["Direct-Mapped", "2-Way Set Associative", "4-Way Set Associative"];

        // create the cache organization dropdown menu
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
                this.updateNumBits();
                this.generateAddress();
                this.generateAnswer();
                this.resetHighlight();
            }.bind(this),
            false);

        // Generate the drop-down menu for address length
        this.bitsLengthArray = ["4 bits", "8 bits", "16 bits"];
        
        // create the menu node for address length
        this.addrMenuNode = document.createElement("select");
        for (var i = 0; i < this.bitsLengthArray.length; i++) {
            var option = document.createElement("option");
            option.value = this.bitsLengthArray[i];
            option.text = this.bitsLengthArray[i];
            this.addrMenuNode.appendChild(option);
        }
        this.addrMenuNode.setAttribute("class", "form form-control selectwidthauto");
        // When the option fo addrMenuNode is changed, 
        this.addrMenuNode.addEventListener("change",
            function () {
                this.updateNumBits();
                this.generateAddress();
                this.generateAnswer();
                this.resetHighlight();
            }.bind(this),
            false);
        
        // create the section that prompts question
        // create question prompt (address)
        this.addressNode = document.createElement("div");
        this.addressNodeText = document.createTextNode("address: 0b ");
        this.addressNodeAddress = document.createElement("div");
        this.addressNode.appendChild(this.addressNodeAddress);
        this.addressNode.style.textAlign = "center";
        // create help text
        this.helpNode = document.createElement("div");
        this.helpNode.textContent = "Usage: Given the cache organization and info above, "+
        "select a range of bits, and then click its corresponding button below.";
        
        // create question prompt (block size, total number of lines)
        this.promptNode = document.createElement("p");
        this.blockNodeText = document.createTextNode("block size: ");
        this.blockNodeBlock = document.createElement("code");
        this.blockNodeBlock.textContent = this.block_size_ans;
        this.lineNodeText = document.createTextNode(" total number of lines: ");
        this.lineNodeLine = document.createElement("code");
        this.lineNodeLine.textContent = this.num_line_ans;
        this.promptNode.appendChild(this.blockNodeText);
        this.promptNode.appendChild(this.blockNodeBlock);
        this.promptNode.appendChild(this.lineNodeText);
        this.promptNode.appendChild(this.lineNodeLine);
        this.promptNode.style.textAlign = "center";
        this.promptNode.style.fontSize = "24px";
        
        // put all question prompt segements together
        this.statementDiv = document.createElement("div");
        this.statementDiv.append("   Cache Organization: ");
        this.statementDiv.appendChild(this.orgMenuNode);
        this.statementDiv.append("   Address Length: ");
        this.statementDiv.appendChild(this.addrMenuNode);
        this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.appendChild(document.createElement("br"));
        this.statementDiv.appendChild(this.promptNode);
        this.statementDiv.appendChild(document.createElement("br"));
        
        // set question prompt apart from the rest by a white background
        this.statementDiv.style.borderWidth = "1px";
        this.statementDiv.style.borderRadius = "5px";
        this.statementDiv.style.borderBlockStyle = "solid";
        this.statementDiv.style.borderBlockColor = "White";
        this.statementDiv.style.backgroundColor = "White";

        // create selected bits display section
        this.inputBitsDiv = document.createElement("div");
        this.input_tag_text = document.createTextNode("Your current tag bits: ");
        this.input_tag_count = document.createElement("code");
        this.input_tag_count.textContent = "0";
        this.input_index_text = document.createTextNode("Your current index bits: ");
        this.input_index_count = document.createElement("code");
        this.input_index_count.textContent = "0";
        this.input_offset_text = document.createTextNode("Your current offset bits: ");
        this.input_offset_count = document.createElement("code");
        this.input_offset_count.textContent = "0";
        this.inputBitsDiv.appendChild(this.input_tag_text);
        this.inputBitsDiv.appendChild(this.input_tag_count);
        this.inputBitsDiv.appendChild(this.input_index_text);
        this.inputBitsDiv.appendChild(this.input_index_count);
        this.inputBitsDiv.appendChild(this.input_offset_text);
        this.inputBitsDiv.appendChild(this.input_offset_count);
        this.inputBitsDiv.style.textAlign = "center";

        this.containerDiv.appendChild(this.statementDiv);
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.helpNode);
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.addressNode);
        this.containerDiv.appendChild(document.createElement("br"));
        this.containerDiv.appendChild(this.inputBitsDiv);
        // this.containerDiv.appendChild(document.createElement("br"));


        // Copy the original elements to the container holding what the user will see.
        $(this.origElem).children().clone().appendTo(this.containerDiv);
        
        this.generateAddress();
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

    renderCachePartitionButtons() {
        // "check me" button and "generate a number" button
        this.submitButton = document.createElement("button");
        this.submitButton.textContent = $.i18n("msg_cachepartition_check_me");
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
        this.generateButton.textContent = $.i18n("msg_cachepartition_generate_a_number");
        $(this.generateButton).attr({
            class: "btn btn-success",
            name: "Generate Another",
            type: "button",
        });
        this.generateButton.addEventListener(
            "click",
            function () {
                this.updateNumBits();
                this.generateAddress();
                this.generateAnswer();
                this.resetHighlight();
            }.bind(this),
            false)
        ;
        
        // render the "set tag", "set index", "set offset", "reset" buttons
        this.questionButtionDiv = document.createElement("div");
        this.tagButton = document.createElement("button");
        this.tagButton.textContent = "Set to Tag";
        $(this.tagButton).attr({
            class: "btn btn-danger",
            name: "Select Tag",
            type: "button",
        });
        this.tagButton.addEventListener(
            "click",
            function () {
                this.highlightSelectedTag();
                this.currInputBits();
                this.hidefeedback();
            }.bind(this),
            false)
        ;
        
        this.indexButton = document.createElement("button");
        this.indexButton.textContent = "Set to Index";
        $(this.indexButton).attr({
            class: "btn btn-primary",
            name: "Select Index",
            type: "button",
        });
        this.indexButton.addEventListener(
            "click",
            function () {
                this.highlightSelectedIndex();
                this.currInputBits();
                this.hidefeedback();
            }.bind(this),
            false)
        ;
        
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
        this.questionButtionDiv.appendChild(this.tagButton);
        this.questionButtionDiv.appendChild(this.indexButton);
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
        
        
        this.genRandList();
        while (this.checkSameRandList()) {
            this.genRandList();
        }
    
        this.tag_bits = this.rand_list[0];
        this.index_bits = this.rand_list[1];
        this.offset_bits = this.rand_list[2];
        
        // calculate the sizes for each component
        this.block_size = 1 << this.offset_bits;
        this.num_entry = 1 << this.index_bits;  
        this.last_rand_choice = this.rand_list;
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
    
    // randomly generate a memory address
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
    
    // set the selected bits in the memory address into corresponding colors of tag
    highlightSelectedTag() {
        let selection = window.getSelection();
        for ( var i = 0 ; i < this.num_bits; i ++ ) {
            if (selection.containsNode( this.address_node_list[ i ], true ) ) {
                (this.address_node_list[ i ]).className = "tagclass";
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
        this.block_size_ans = this.block_size;
        this.entries_ans = this.num_entry;
        
        // number of lines have something to do with the set associatives
        switch (this.orgMenuNode.value) {
            case "Direct-Mapped" : 
                this.num_line_ans = this.entries_ans;
                break;
            case "2-Way Set Associative" : 
                this.num_line_ans = (this.entries_ans)*2;
                break;
            case "4-Way Set Associative" : 
                this.num_line_ans = (this.entries_ans)*4;
                break;
        }
        this.generatePrompt();

        this.blockNodeBlock.textContent = this.block_size_ans.toString();
        this.lineNodeLine.textContent = this.num_line_ans.toString();
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
        for (let i = 0; i < this.tag_bits; i++) {
            if (this.address_node_list[i].className != "tagclass") {
                this.correct = false;
                return;
            }
        }
        for (let i = this.tag_bits; i < (this.tag_bits + this.index_bits); i++) {
            if (this.address_node_list[i].className != "indexclass") {
                this.correct = false;
                return;
            }
        }
        for (let i = (this.tag_bits + this.index_bits); i < this.num_bits; i++) {
            if (this.address_node_list[i].className != "offsetclass") {
                this.correct = false;
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
            event: "cachepartition",
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
     * Calculates and display the number of bits for tag index and offset correspondingly
     */
    currInputBits() {
        this.input_tag_bits = 0;
        this.input_index_bits = 0;
        this.input_offset_bits = 0;
        for (let i = 0; i < this.num_bits; i++) {
            if (this.address_node_list[i].className == "tagclass") {
                this.input_tag_bits += 1;
            } else if (this.address_node_list[i].className == "indexclass") {
                this.input_index_bits += 1;
            } else if (this.address_node_list[i].className == "offsetclass") {
                this.input_offset_bits += 1;
            }
        }
        this.input_tag_count.textContent = this.input_tag_bits.toString();
        this.input_index_count.textContent = this.input_index_bits.toString();
        this.input_offset_count.textContent = this.input_offset_bits.toString();
    }

    // update the address to display
    updateDisplayedAddress() {
        var breakNode = null;
        this.addressNodeAddress.innerHTML = "";
        this.addressNodeAddress.appendChild(this.addressNodeText);
        for ( var i = 0 ; i < this.num_bits ; i ++ ) {
            this.address_node_list[ i ].style.fontSize = "18px";
            this.addressNodeAddress.appendChild(this.address_node_list[ i ]);
            // insert an empty node between neighboring two bit nodes
            if ( i != this.num_bits - 1 ) {
                breakNode = document.createElement("code");
                breakNode.setAttribute("class", "prevent-select");
                breakNode.style.fontSize = "18px";
                this.addressNodeAddress.appendChild(breakNode);
            }
        }
    }
    // update the prompt
    generatePrompt() {
        this.updateDisplayedAddress();
        this.blockNodeBlock.textContent = this.block_size_ans;
        this.lineNodeLine.textContent = this.num_line_ans;
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

        if (this.correct) {
            feedback_html += "<div>" + $.i18n("msg_cachepartition_correct") + "</div>";
            $(this.feedbackDiv).attr("class", "alert alert-info");
        } else {
            feedback_html += "<div>" + $.i18n("msg_cachepartition_incorrect") + "</div>";
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
    $("[data-component=cachepartition]").each(function (index) { 
        var opts = {
            orig: this,
            useRunestoneServices: eBookConfig.useRunestoneServices,
        };
        if ($(this).closest("[data-component=timedAssessment]").length == 0) {
            // If this element exists within a timed component, don't render it here
            try {
                cachepartitionList[this.id] = new cachepartition(opts);
            } catch (err) {
                console.log(
                    `Error rendering Cache Information Problem ${this.id}
                     Details: ${err}`
                );
            }
        }
    });
});
