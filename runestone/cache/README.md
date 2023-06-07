# Caching Exercise Components

This folder contains three caching-exercise-related Runestone components: ```cacheinfo```, ```cachepartition```, and ```cachetable```.
Each component is capable of automatically generating a question prompt based on reader's choices and checking answers on the fly. 


## cacheinfo
For the prompt, based on user's choice of ```cache organization``` and ```address length```, this component randomly generates a ```memory address```, represented in binary,
and the bit-length respectively for the tag, index, and offset. 
- ```cache organization``` for choice includes ```Direct-Mapped```, ```2-Way Set Associative```, and ```4-Way Set Associative```.
- ```address length``` for choice includes ```4 bits```, ```8 bits```, and ```16 bits```.

To answer the question, the reader should determine the size of cache data block (in bytes), the number of entries, and the number of lines in the given cache structure
organization.

### **Example 1**: 
#### Exercise creation with personalized parameters

```html
<section id="cache-info">
<h1>cacheinfo example 1</h1>
    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="cacheinfo" data-question_label="1" id="example_cache_info_1"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {
            "num_bits": 8, 
            "cache_org" : ["Direct-Mapped", "2-Way Set Associative", "4-Way Set Associative"], 
            }
        </script>
    </div>
    </div>
</section>
```

### **Example 2**: 
#### Exercise creation with default parameters
```html
<section id="cache-info">
<h1>cacheinfo example 2</h1>
    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="cacheinfo" data-question_label="2" id="example_cache_info_2"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {}
        </script>
    </div>
    </div>
</section>
```