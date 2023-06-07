Caching Exercise Components
==========================

This folder contains three caching-exercise-related Runestone components: **cacheinfo**, **cachepartition**, and **cachetable**. 
Each component is capable of automatically generating a question prompt based on reader's choices and check answers on the fly. 

Cache Info
-----------------------

Basics
####
For the prompt, based on user's choice of *cache organization* and *address length*, this component randomly generates a *memory address*, represented in binary,
and the bit-length respectively for the tag, index, and offset. 
* *cache organization* for choice includes Direct-Mapped, 2-Way Set Associative, and 4-Way Set Associative.
* *address length* for choice includes 4-bits, 8-bits, and 16-bits.

To answer the question, reader should determine the size of cache data block (in bytes), the number of entries, and the number of lines in the given cache structure
organization.

Usage Example
#####
* example 1: 
.. code-block:: html
   :linenos:
    <section id="caching info">
    <h1>Cache Info<a class="headerlink" href="#number-conversion" title="Permalink to this heading">¶</a></h1>
                <p>cacheinfo-example-1</p>
            <div class="runestone ">
            <div data-component="cacheinfo" data-question_label="1" id="cacheinfo-example-1"  style="visibility: hidden;"></div>
            </div>
    </section>

* example 2:
.. code-block:: html
   :linenos:
    <section id="caching info">
    <h1>Cache Info<a class="headerlink" href="#number-conversion" title="Permalink to this heading">¶</a></h1>
                <p>cacheinfo-example-2</p>
            <div class="runestone ">
            <div data-component="cacheinfo" data-question_label="2" id="cacheinfo-example-2"  style="visibility: hidden;"></div>
            </div>
    </section>

Cache Address Partition
-----------------------

Basics
####
Usage Example
#####


Cache Table
-----------------------

Basics
####
Usage Example
#####

Provide an example
------------------

The folder ``runestone/<component>/test/index.rst``  is a great place to add code
that demonstrates your new feature or component in action.

In fact you should provide two examples whenever possible to demonstrate that you can have
multiple instances of your component on a single web page.

Internationalization
--------------------

It is recommended to implement internationalization as described in `I18N` even if you plan to support only English currently. Besides making easy to support other languages in the future, internationalization helps you to better separate natural language text fragments from the rest of your code.


Major Feature Contributions
===========================

There are many ways that we can continue to improve and make the Runestone platform great, and I am exited to see the platform evolve.  What I would ask is that if you have a large new feature that you would like to propose / contribute please start by creating an issue.  This will allow us to discuss it together up front, consider the design implications, and make it more likely that the PR will be accepted with a minimum of fuss.

Runestone has grown organically over the years but that has led to duplicated tables in the database duplicated code and lots of inconsistency.  We need to start working to change all of that if we are going to continue to grow Runestone efficiently.


JavaScript
----------
All the JavaScript files in the Runestone Components are analyzed by webpack. If you add or remove JavaScript files, update the `webpack.index.js`.