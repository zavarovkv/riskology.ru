const ITER_COUNT = 10000;

/******************************************************************
    RiskFactor class
******************************************************************/

var RiskFactor = function(max, normal, min) {
    this.max = 1 + max;
    this.normal = 1 + normal;
    this.min = 1 + min;

    this.lt = this.normal - this.min;
    this.rt = this.max - this.normal;

    this.slt = this.lt / (this.lt + this.rt)
    this.srt = this.rt / (this.lt + this.rt)

    this.r = [];
    this.use_slt = [];
    this.use_srt = [];
    this.use_lt = [];
    this.use_rt = [];
    this.v = [];

    this.generate();
};

RiskFactor.prototype.generate = function() {

    if(this.max == this.min == this.normal == 1) {
        for (var i = 0; i < ITER_COUNT ; i++) {
            this.v[i] = 1;
        }

    } else {

        for (var i = 0; i < ITER_COUNT ; i++) {

            this.r[i] = Math.random(); //(i + 1) / 100;

            if (this.r[i] > this.slt) {
                this.use_slt[i] = this.slt;
            } else {
                this.use_slt[i] = this.r[i];
            }

            if (this.r[i] > this.slt) {
                this.use_srt[i] = this.r[i] - this.slt;
            } else {
                this.use_srt[i] = 0;
            }

            if (this.r[i] > this.slt) {
                this.use_lt[i] = this.normal;
            } else {
                this.use_lt[i] = this.min + this.lt * Math.sqrt(this.r[i] / this.slt);
            }

            if (this.use_srt[i] == 0) {
                this.use_rt[i] = 0;
            } else {
                this.use_rt[i] = this.rt * (1 - Math.sqrt((this.srt - this.use_srt[i]) / this.srt));
            }

            this.v[i] = this.use_rt[i] + this.use_lt[i];
        }

    }
};

RiskFactor.prototype.generateEmpty = function() {
    console.log(ITER_COUNT );

    for (var i = 0; i < ITER_COUNT ; i++) {
        this.v[i] = 1;
    }
}





/******************************************************************
 Riskology class
 ******************************************************************/

var Riskology = function (prj_nano_during, cnt_groups) {
    this.risk_factors = [];
    this.delay_factor = [];
    this.equal_delay_factor = [];

    // Calculated in days
    this.delay_during = [];

    // Calculated in days
    this.prj_nano_during = prj_nano_during;
    this.prj_max_during = 0;
    this.prj_min_during = 0;
    this.prj_dif_during = 0;

    // Count of groups for histogram
    this.cnt_groups = cnt_groups;
    this.groups = [];
    this.risk_matrix = [];
    this.risk_matrix_sum = [];

    // Arrays for calculate scale (Y)
    this.scale_days = []
};


// Add Risk to Riskology
Riskology.prototype.addRisk = function(risk) {
    this.risk_factors.push(risk);
};


// Calculate steps
Riskology.prototype.calculateGroups = function() {
    var result = [];
    var diff_value = this.prj_dif_during / (this.cnt_groups - 1);

    result[0] = this.prj_min_during;

    for (var i = 1; i < this.cnt_groups; i++) {
        result[i] = result[i-1] + diff_value;
    }

    return result;
};

Riskology.prototype.calculateScaleDays = function () {
    var result = [];

    for (var i = 0; i < this.groups.length; i++) {
        result[i] = Math.round(this.groups[i]);
    }

    return result;
};


// Calculate Risk Matrix
Riskology.prototype.calculateRiskMatrix = function() {
    var result = [];
    var diff_value = this.prj_dif_during / (this.cnt_groups - 1);
    var min_step = this.prj_min_during - diff_value;

    // first element (for i = 0)
    result[0] = [];
    for (var j = 0; j < this.delay_during.length; j++) {
        if((min_step <= this.delay_during[j]) && (this.delay_during[j] < this.groups[0])) {
            result[0][j] = 1;
        } else {
            result[0][j] = 0;
        }
    }

    // other
    for (var i = 1; i < this.cnt_groups - 1; i++) {
        result[i] = [];
        for (var j = 0; j < this.delay_during.length; j++) {
            if((this.groups[i-1] <= this.delay_during[j]) && (this.delay_during[j] < this.groups[i])) {
                result[i][j] = 1;
            } else {
                result[i][j] = 0;
            }
        }
    }

    // last element
    result[this.cnt_groups - 1] = [];
    for (var j = 0; j < this.delay_during.length; j++) {
        if((this.groups[i-1] <= this.delay_during[j]) && (this.delay_during[j] <= this.groups[i])) {
            result[i][j] = 1;
        } else {
            result[i][j] = 0;
        }
    }

    return result;
};


// Calculate sum of elements for Risk-matrix
Riskology.prototype.calculateSumOfRiskMatrix = function() {
    var result = [];

    for (var i = 0; i < this.cnt_groups; i++) {
        result[i] = this.risk_matrix[i].reduce(function(a, b) { return a + b; }, 0);
    }

    return result;
};


// Calculate all
Riskology.prototype.calculate = function() {
    var cnt = this.risk_factors[0].v.length;

    for (var i = 0; i < cnt; i++) {

        // Calculate Delay Factor
        this.delay_factor[i] = 1;
        for(var j = 0; j < this.risk_factors.length; j++) {
            this.delay_factor[i] *= this.risk_factors[j].v[i];
        }

        // Calculate Delay During
        this.delay_during[i] = this.delay_factor[i] * this.prj_nano_during;

        // Calculate Equal Delay Factor
        this.equal_delay_factor[i] = this.delay_during[i] / this.prj_nano_during;
    }

    // Calculate project during's: max value, min value and different value
    this.prj_max_during = Math.max.apply(null, this.delay_during);
    this.prj_min_during = Math.min.apply(null, this.delay_during);
    this.prj_dif_during = this.prj_max_during - this.prj_min_during;

    // Calculate groups values
    this.groups = this.calculateGroups();

    // Output temporary results
    console.log('Nano duration: ' + this.prj_nano_during);
    console.log('Min duration: ' + this.prj_min_during);
    console.log('Max duration: ' + this.prj_max_during);
    console.log('Steps: ' + this.groups);

    this.scale_days = this.calculateScaleDays();
    console.log('Scale in days: ' + this.scale_days);

    // Calculate Risk Matrix
    this.risk_matrix = this.calculateRiskMatrix();
    //console.log('First line of Risk Matrix: ' + this.risk_matrix[30]);

    // Calculate sum
    this.risk_matrix_sum = this.calculateSumOfRiskMatrix();
    console.log('Risk Matrix Sum: ' + this.risk_matrix_sum);

};

// Return result array
Riskology.prototype.getResult = function() {
    var result = [];

    this.calculate();

    for(var i = 0; i < this.risk_matrix_sum.length; i++) {
        result[i] = [];
        result[i][0] = this.scale_days[i];
        result[i][1] = this.risk_matrix_sum[i];
    }

    //console.log('VizualData #1: ' + result[0]);
    return result;
};

// Return count of actual risks
Riskology.prototype.getRiskCount = function() {
    return this.risk_factors.length;
};

// Return count of iterations
Riskology.prototype.getIterCount = function() {
    return this.getIterCount()
};

