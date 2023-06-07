# Caching Exercise Components

This folder contains three caching-exercise-related Runestone components: ```cacheinfo```, ```cachepartition```, and ```cachetable```.
Each component is capable of automatically generating a question prompt based on reader's choices and checking answers on the fly. 


## cacheinfo
For the prompt, based on user's choice of ```cache organization``` and ```address length```, this component randomly generates a ```memory address```, represented in binary,
and the bit-length respectively for the tag, index, and offset. 
- ```cache organization``` for choice includes Direct-Mapped, 2-Way Set Associative, and 4-Way Set Associative.
- ```address length``` for choice includes ```4-bits```, ```8-bits```, and ```16-bits```.

To answer the question, reader should determine the size of cache data block (in bytes), the number of entries, and the number of lines in the given cache structure
organization.

### **Example 1**: Exercise creation with personalized parameters
```html
<section id="caching info">
<h1>Cache Info<a class="headerlink" href="#number-conversion" title="Permalink to this heading">¶</a></h1>
            <p>cacheinfo-example-1</p>
        <div class="runestone ">
        <div data-component="cacheinfo" data-question_label="1" id="cacheinfo-example-1"  style="visibility: hidden;"></div>
        </div>
</section>
```

### **Example 2**: Exercise creation with default parameters
```html
<section id="caching info">
<h1>Cache Info<a class="headerlink" href="#number-conversion" title="Permalink to this heading">¶</a></h1>
            <p>cacheinfo-example-2</p>
        <div class="runestone ">
        <div data-component="cacheinfo" data-question_label="2" id="cacheinfo-example-2"  style="visibility: hidden;"></div>
        </div>
</section>
```