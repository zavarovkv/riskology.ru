var script_loaded = false;
function loadScript(src, callback) {
    var s, r, t;
    r = false;
    s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = src;
    s.onload = s.onreadystatechange = function() {
        //console.log( this.readyState ); //uncomment this line to see which ready states are called.
        if ( !r && (!this.readyState || this.readyState == 'complete') ) {
            r = true;
            callback();
        }
    };
    t = document.getElementsByTagName('script')[0];
    t.parentNode.insertBefore(s, t);
}

loadScript('https://www.gstatic.com/charts/loader.js', function () {
    google.charts.load('current', {'packages': ['bar', 'corechart'], callback: function () {
        script_loaded = true;
    }});
});



/******************************************************************
 Events
 ******************************************************************/

$(document).ready(
    function($) {
        moment.locale('ru');

        // MailChimp function
        window.fnames = new Array();
        window.ftypes = new Array();
        fnames[0] = 'EMAIL';
        ftypes[0] = 'email';
        fnames[1] = 'FNAME';
        ftypes[1] = 'text';
        fnames[2] = 'LNAME';
        ftypes[2] = 'text';
        // var $mcj = jQuery.noConflict(true);

        $('input[name="input_deadline"]').daterangepicker(
            {
                language: 'ru',
                startDate: moment(),
                endDate: moment().add('90', 'days'),
                buttonClasses: ['btn btn-default'],
                applyClass: 'btn-small btn-primary',
                cancelClass: 'btn-small',
                locale: {
                    format: 'DD MMMM YYYY'
                }
            }
        );


        $(".flat-slider-vertical-bad, .flat-slider-vertical-good, .flat-slider-vertical-likely")
            .slider({
                max: 100,
                min: 0,
                range: "min",
                orientation: "vertical",
                step: 5
            })
            .slider("pips", {
                first: "pip",
                last: "pip"
            })
            .slider("float");


        $(".risk5-slider")
            .slider({
                max: 50,
                min: -50,
                range: "min",
                orientation: "vertical",
                step: 5
            })
            .slider("pips", {
                first: "pip",
                last: "pip"
            })
            .slider("float");

        // Start sliders value for risk #1
        $("#slider-risk1-bad")
            .slider({
                value: 55
            });
        $("#slider-risk1-likely")
            .slider({
                value: 5
            });
        $("#slider-risk1-good")
            .slider({
                value: 0
            });

        // Start sliders value for risk #2
        $("#slider-risk2-bad")
            .slider({
                value: 16,
            });
        $("#slider-risk2-likely")
            .slider({
                value: 5,
            });
        $("#slider-risk2-good")
            .slider({
                value: 0,
            });

        // Start sliders value for risk #3
        $("#slider-risk3-bad")
            .slider({
                value: 8,
            });
        $("#slider-risk3-likely")
            .slider({
                value: 4,
            });
        $("#slider-risk3-good")
            .slider({
                value: 0,
            });

        // Start sliders value for risk #4
        $("#slider-risk4-bad")
            .slider({
                value: 15,
            });

        // Start sliders value for risk #5
        $("#slider-risk5-bad")
            .slider({
                value: 15,
            });
        $("#slider-risk5-likely")
            .slider({
                value: 0,
            });
        $("#slider-risk5-good")
            .slider({
                value: -15,
            });


        $('.ui-slider-vertical').slider({
            slide: function (event, ui) {
                changeConnectedSliders(ui);
            }
        });
        
        function takeValue(class_name) {
            return $('#' + class_name + ' span.ui-slider-tip').text();
        }

        function changeValue(class_name, value) {
            $("#" + class_name)
                .slider({
                    value: value
                });
        }

        // < - less, > - more
        function changeConnectedSliders(ui) {
            var mapping = {
                'bad':      [['likely', 'less'], ['good', 'less']],
                'likely':   [['bad', 'more'], ['good', 'less']],
                'good':     [['likely', 'more'], ['bad', 'more']]
            }

            var id = $(ui.handle)[0].parentElement.id;
            var id_arr = id.split('-');

            $.each(mapping[id_arr[2]], function (index, value) {
                var prev_value = takeValue('slider-' + id_arr[1] + '-' + value[0]);

                if (value[1] == 'less') {
                    if (ui.value < prev_value) {
                        changeValue('slider-' + id_arr[1] + '-' + value[0], ui.value);
                    }
                } else {
                    if (ui.value > prev_value) {
                        changeValue('slider-' + id_arr[1] + '-' + value[0], ui.value);
                    }
                }
            });
        }



        $("input[type='checkbox']").change(function () {
            if ($(this).is(':checked')) {
                $('.' + $(this).attr('id')).show();
            } else {
                $('.' + $(this).attr('id')).hide();
            }
        });

        $("#btn_run").click(function () {
            calculateRisks();
        });

        $("#mc-embedded-subscribe").click(function () {
            $("#mc_embed_signup").hide();
        });
    }
);





/******************************************************************
 Functions
 ******************************************************************/

//
// Run calculate risks for user input data
//
function calculateRisks() {

    $('.chart-container').hide();

    // Get range od dates
    var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds

    var startDate = $('input[name="input_deadline"]').data('daterangepicker').startDate._d;
    var endDate = $('input[name="input_deadline"]').data('daterangepicker').endDate._d;
    var diffDays = Math.round(Math.abs((startDate.getTime() - endDate.getTime())/(oneDay)));

    // Calculate count of bars fro histogram
    if (diffDays < 15) {

        var answer_html = "<p>Используйте инструмент для проектов длительностью больше 2'х недель.</p>";
        showSimpleAnswer(answer_html);

    } else {

        var riskology = new Riskology(diffDays);

        var b_correct_answer = true;

        for (var i = 0; i < $('.toggle input[type="checkbox"]').length; i++) {

            if ($('#risk-' + (i + 1)).is(':checked')) {
                var bad = parseInt($('.risk-' + (i + 1)).find('div.flat-slider-vertical-bad span.ui-slider-tip').text());
                var likely = parseInt($('.risk-' + (i + 1)).find('div.flat-slider-vertical-likely span.ui-slider-tip').text());
                var good = parseInt($('.risk-' + (i + 1)).find('div.flat-slider-vertical-good span.ui-slider-tip').text());

                if (bad != 0) bad /= 100;
                if (likely != 0) likely /= 100;
                if (good != 0) good /= 100;

                if (bad === good) b_correct_answer = false;

                var risk = new RiskFactor(bad, likely, good);
                riskology.addRisk(risk);
            }
        }

        // Create answer and show it
        if(b_correct_answer) createAnswer(riskology)
        else {
            var answer_html = '<p>Наихудшее значение задержки <b>НЕ</b> может равняться наилучшему значению. ' +
                              'Подумайте, как этого избежать и обновите значенния рисков.</p>' +
                              'Управление рисками подразумевает внимательность к деталям.';
            showSimpleAnswer(answer_html);
        }
    }
}



//
// Create answer with histograms and answer text
//
function createAnswer(riskology) {

    // If user didn't add risks
    if (riskology.getRiskCount() == 0) {

        if ($('#no-risk-4').is(":checked"))
        {
            var value = parseInt($('.no-risk-4').find('div.flat-slider-vertical-bad span.ui-slider-tip').text());
            var result_str = '<p><b>С вероятностью - ' + value.toString() + '% </b> проект прекратится, вы это и сами знаете.</p>' +
                             '<p>Учитывайте и другие риски для более детальных расчетов.</p>';

            showSimpleAnswer(getAnswerWithouRisksHtml(result_str));
        } else {
            showSimpleAnswer(getAnswerWithouRisksHtml('Забыли про риски. Не делайте так в живых проектах.'));
        }

    } else {

        var risk_result = riskology.getResult();

        // Create data for histograms
        var histogram_data = getHistogramData(risk_result);
        var probably_data = getProbablyData(histogram_data);
        var p_data = getProbablyResult(probably_data);

        showFullAnswer(getAnswerFullHtml(p_data[0], p_data[1], p_data[2], p_data[3], p_data[4]), histogram_data, probably_data);
    }
}



//
// Transformation riskology data to histogram array
//
function getHistogramData(risk_result) {

    var result = [];
    var startDate = $('input[name="input_deadline"]').data('daterangepicker').startDate;

    // Set real date for scale
    var actual_date;

    for (var i = 0; i < risk_result.length; i++) {

        actual_date = moment(startDate).add(risk_result[i][0].toString(), 'days').format('LL');
        result[i] = [];
        result[i][0] = actual_date.toString();
        result[i][1] = risk_result[i][1]; // not changing

    }

    return result;
}



//
// Transformation riskology data to probably array
//
function getProbablyData(histogram_data) {

    var result = [];

    for (var i = 0; i < histogram_data.length; i++) {

        result[i] = [];
        result[i][0] = histogram_data[i][0]; // not changing

        // Set probability
        if (i == 0) {
            result[i][1] = histogram_data[i][1] / ITER_COUNT * 100;
        } else {
            result[i][1] = result[i-1][1] + histogram_data[i][1] / ITER_COUNT * 100;
        }
    }

    return result;
}



//
// Calculate and get 0 probability, 0.5 probability and 0.75 probability intervals
//
function getProbablyResult(p_data) {
    var p_0_start = 0;
    var p_0_end = 0;
    var p_50_start = 0;
    var p_50_end = 0;
    var p_75 = 0;

    for (var i = 0; i < p_data.length; i++) {

        // Find 0.1 probability
        if (p_data[i][1] > 0 && p_data[i-1][1] == 0) {
            p_0_start = p_data[i][0].toString();
            p_0_end = p_data[i + 1][0].toString();
        }

        // Find 0.5 probability
        if (p_data[i][1] >= 50 && p_data[i-1][1] <= 50) {
            p_50_start = p_data[i - 1][0].toString();
            p_50_end = p_data[i][0].toString();
        }

        // Find 0.75 probability
        if (p_data[i][1] >= 75 && p_data[i-1][1] <= 75) {
            p_75 = p_data[i][0].toString();
        }

    }

    return [p_0_start, p_0_end, p_50_start, p_50_end, p_75];
}



//
// Draw Bar histogram
//
function drawHistogram(h_data) {

    h_data.unshift(['', '']);

    var data = new google.visualization.arrayToDataTable(h_data);

    var width = $(window).width() - $(window).width() * 0.07;
    if(width > 700) width = 700;

    var options = {
        width: width,
        height: 400,
        legend: {position: 'none'},
        bar: {groupWidth: "100%"}
    };

    var chart = new google.charts.Bar(document.getElementById('chart_div'));
    chart.draw(data, google.charts.Bar.convertOptions(options));
}



//
// Draw probability chart
//
function drawProbablyHistogram(p_data) {

    p_data.unshift(['', '']);

    var data = new google.visualization.arrayToDataTable(p_data);

    var width = $(window).width() - $(window).width() * 0.07;
    if(width > 700) width = 700;

    var options = {
        width: width,
        height: 400,
        curveType: 'function',
        legend: { position: 'none' }
    };

    var chart = new google.visualization.LineChart(document.getElementById('chart_v_div'));
    chart.draw(data, options);
}



//
// Create and show only text answer
//
function showSimpleAnswer(answer_str) {
    $('.result_text').html(answer_str);
    $('.chart-container').hide();
    $('.result-container').show();
}



//
// Create and show full answer: text and histograms
//
function showFullAnswer(answer_str, h_data, p_data) {

    $('.result_text').html(answer_str);
    $('.result-container').show();

    $('.chart-container').show();

    var counter = 0;
    if (script_loaded === true) {
        drawHistogram(h_data);
        drawProbablyHistogram(p_data);
    } else {
        //show loader
        $('.chart-container').prepend('<div class="loader"></div>');


        var refreshIntervalId = setInterval(function() {
            if (script_loaded === true) {
                drawHistogram(h_data);
                drawProbablyHistogram(p_data);

                clearInterval(refreshIntervalId);
                $('.loader').hide();
                //hide loader
            } else {
                if (counter == 19) {
                    clearInterval(refreshIntervalId);
                    //show message about mistake
                    $('.loader').hide();
                }
                counter++;
            }
        }, 1000);
    }
}



/******************************************************************
 Functions for create HTML-elements
 ******************************************************************/

function getAnswerFullHtml(prob_0_start, prob_0_end, prob_50_start, prob_50_end, prob_75) {

    var result = "<p>Существует некоторая <span class='prob_0'>ненулевая вероятность</span> завершения проекта ";

    if (prob_0_start != prob_0_end) {
        result +=  "в период между <span class='light_text'>" + prob_0_start + "</span> и <span class='light_text'>" + prob_0_end + "</span></p>";
    } else {
        result +=  "<span class='light_text'>" + prob_0_end + "</span></p>";
    }

    result += "<p><span class='prob_50'>Значительно вероятнее</span>, однако, что вы будете готовы ";

    if (prob_50_start != prob_50_end) {
        result += "между <span class='light_text'>" + prob_50_start + "</span> и <span class='light_text'>" + prob_50_end + "</span></p>";
    } else {
        result +=  "<span class='light_text'>" + prob_50_end + "</span></p>";
    }

    result += "<p>С <span class='prob_75'>75%-ной достоверностью</span> можно назначить сроком сдачи <span class='light_text'>" + prob_75 + "</span></p>";

    if ($('#no-risk-4').is(":checked"))
    {
        var value = parseInt($('.no-risk-4').find('div.flat-slider-vertical-bad span.ui-slider-tip').text());
        result += '<p><b>С вероятностью - ' + value.toString() + '% </b> проект прекратится.</p>';
    }

    result += "<div class='quote-info'><p><b>Диаграмма совокупного риска</b> показвает результат прогонов проекта через симулятор 50 000 раз.</p>" +
              "<p><b>Кумулятивная диаграмма</b> показывает вероятность завершения проекта от 0 до 100% во времени.</p></div>";

    return result;
}

function getAnswerWithouRisksHtml(data) {

    var result = data;

    return result;
}