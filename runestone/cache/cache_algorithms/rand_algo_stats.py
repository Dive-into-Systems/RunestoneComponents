'''
cache behavoirs to keep track on potentially:
    (1) cold start miss
    (2) conflict miss: related to number of rows
    (3) miss / hit ratio
    (4) coverage of all indices
    (5) address variety
'''

class rand_Algo:
    def __init__(self):
        self.addresses = []
        self.hit_miss_list = []
        self.cold_start_miss = None
        self.conflict_miss = None
        self.hit_miss_ratio = None
        self.indices_coverage = None
        self.address_variety = None