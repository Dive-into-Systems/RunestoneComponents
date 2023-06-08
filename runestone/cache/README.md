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
#### Exercise creation with customized parameters

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

## cachepartition
The question asks the reader to partition a memory address into the tag, index, and offset. 

For the prompt, again, reader should select ```cache organization``` and ```address length``` from the menu. Based on the selection, 
this component randomly generates a ```memory address```.

- ```cache organization``` for choice includes ```Direct-Mapped```, ```2-Way Set Associative```, and ```4-Way Set Associative```.
- ```address length``` for choice includes ```4 bits```, ```8 bits```, and ```16 bits```.

To answer the question, user should use their cursor and drag through the part that they want to highlight, and click on the button to set
the highlighted part to a certain tag. The highlighting color for the tag, index, and offset are red, blue, and yellow, respectively.

### **Example 1**: 
#### Exercise creation with customized parameters
```html
<section id="caching partition-example-1">
<h1>cachepartition example 1</h1>
    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="cachepartition" data-question_label="1" id="example_cache_partition_1"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {
            "num_bits": 8, 
            "cache_org" : "2-Way Set Associative", 
            }
        </script>
    </div>
    </div>
</section>
```

### **Example 2**: 
#### Exercise creation with default parameters
```html
<section id="caching partition-example-2">
<h1>cachepartition example 2</h1>
    <!-- creation of the exercise -->
    <div class="runestone ">
    <div data-component="cachepartition" data-question_label="2" id="example_cache_partition_2"  style="visibility: hidden;">
        <!-- parameter setting of the exercise -->
        <script type="application/json">
            {}
        </script>
    </div>
    </div>
</section>

```