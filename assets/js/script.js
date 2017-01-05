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

        $(".flat-slider-vertical-bad")
            .slider({
                value: 50,
            });

        $(".flat-slider-vertical-likely")
            .slider({
                value: 20,
            });

        $(".flat-slider-vertical-good")
            .slider({
                value: 00,
            });

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

        google.charts.load('current', {'packages': ['bar']});
        google.charts.load('current', {'packages':['corechart']});
    }
);





/******************************************************************
 Functions
 ******************************************************************/

//
// Run calculate risks for user input data
//
function calculateRisks() {

    // Get range od dates
    var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds

    var startDate = $('input[name="input_deadline"]').data('daterangepicker').startDate._d;
    var endDate = $('input[name="input_deadline"]').data('daterangepicker').endDate._d;
    var diffDays = Math.round(Math.abs((startDate.getTime() - endDate.getTime())/(oneDay)));

    // Calculate count of bars fro histogram
    if (diffDays < 8) {

        var answer_html = "<p>Simple answer</p>";
        showSimpleAnswer(answer_html);

    } else {

        var s_count = Math.round(diffDays / 3);
        var riskology = new Riskology(diffDays, s_count);

        for (var i = 0; i < $('.toggle input[type="checkbox"]').length; i++) {

            if ($('#risk-' + (i + 1)).is(':checked')) {
                var bad = parseInt($('.risk-' + (i + 1)).find('div.flat-slider-vertical-bad span.ui-slider-tip').text());
                var likely = parseInt($('.risk-' + (i + 1)).find('div.flat-slider-vertical-likely span.ui-slider-tip').text());
                var good = parseInt($('.risk-' + (i + 1)).find('div.flat-slider-vertical-good span.ui-slider-tip').text());

                if (bad != 0) bad /= 100;
                if (likely != 0) likely /= 100;
                if (good != 0) good /= 100;

                var risk = new RiskFactor(bad, likely, good);
                riskology.addRisk(risk);
            }
        }

        // Create answer and show it
        createAnswer(riskology);
    }
}



//
// Create answer with histograms and answer text
//
function createAnswer(riskology) {

    // If user didn't add risks
    if (riskology.getRiskCount() == 0) {

        showSimpleAnswer(getAnswerWithouRisksHtml('дата'));

    } else {

        var risk_result = riskology.getResult();

        // Create data for histograms
        var histogram_data = getHistogramData(risk_result);
        var probably_data = getProbablyData(histogram_data);

        showFullAnswer(getAnswerFullHtml(0, 0, 0, 0, 0), histogram_data, probably_data);
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
// Draw Bar histogram
//
function drawHistogram(h_data) {

    h_data.unshift(['', '']);

    var data = new google.visualization.arrayToDataTable(h_data);

    var width = $(window).width() - $(window).width() * 0.07;
    if(width > 700) width = 700;

    var options = {
        width: width,
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
    $('.chart-container').show();
    $('.result-container').show();

    drawHistogram(h_data);
    drawProbablyHistogram(p_data);
}



/******************************************************************
 Functions for create HTML-elements
 ******************************************************************/

function getAnswerFullHtml(prob_0_start, prob_0_end, prob_50_start, prob_50_end, prob_75) {

    var result = "<p>Существует некоторая ненулевая вероятность завершения проекта в период между " +
                     prob_0_start + " и " + prob_0_end + ".</p>" +
                     "<p>Значительно вероятнее, однако, что вы будете готовы между " +
                     prob_50_start + " и " + prob_50_end + ".</p>" +
                     "<p>С 75%-ной достоверностью можно назначить сроком сдачи " + prob_75 + "</p>";

    return result;
}

function getAnswerWithouRisksHtml(data) {

    var result = data;

    return result;
}