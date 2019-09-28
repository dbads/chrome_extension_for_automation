console.log('hello from background script');

var response_dict = {}
var params = {
    active : true,
    currentWindow: true
}


$('#generate_form_fields').on('click', (event)=>{    
    $('#generate_form_fields').html('fetching the form fields ...')
    console.log('clicked on generate_form_fields')

    // querying chrome api for current tablink
    // params for current tab

    chrome.tabs.query(params, find_tab_url_and_form_fields)
        
    async function find_tab_url_and_form_fields(tabs){
        var current_tablink = tabs[0].url
        console.log('curernt tab_link = ',current_tablink)

        let url = 'http://autoformstage.clickish.in/form_emulation?college_link='+current_tablink
        console.log('url ', url)

        fetch(url)
        .then(response => response.json())
        .then(json => {
            console.log(json)
            response_dict = json
            if(response_dict['form_elements'] === undefined){
                console.log('changing html')
                $('#generate_form_fields').text(response_dict['message'])
                $('#generate_form_fields').addClass('btn-danger')
            }else{
                fill_form_fields(response_dict['form_elements'])
            }
        })
    }
    
    function fill_form_fields(form_fields){
        console.log('gonna generate the fields with form fields', form_fields)
        // showing all the form fields in the popup for user to fill the input values
        for(index in form_fields){
            let field = form_fields[index]
            let field_type = field['input_type']
            let field_name = field['name']
            let input_element = 
            `<div class="row">
                <div class="col col-md-6">
                    <div class="form-group label-floating">
                            <label for="${field_name}" class="control-label">${field_name}</label>
                            <input type="${field_type}" name="${field_name}" id="${field_name}" class="form-control">
                            <span class="material-input"></span>
                    </div>
                </div>
            </div>
            `
            if(field_type !== "checkbox") $('#form_fields_card').append(input_element).show('slow')
        }
        
        // $('#form_fields_card').append('<button id="emulate" class="btn btn-info btn-block">emulate</button>')
        $('#form_fields_card').css('display','block');
        $('#generate_form_fields').hide();
        $('#emulate').css('display','block');
    
        console.log('generated all the fields')
    }

})


console.log('before emulate click handler')
$('#emulate').on('click', (event) => { 
    let form_fields = response_dict['form_elements']
    console.log('no shit, inside emualte function with form fields ',response_dict.form_fields)

    // here we'll pick the values from input fields available on popup
    // and fill the values on the current tab page on corressponding fields
    for(index in form_fields){
        let field = form_fields[index]
        console.log('field - ', field)
        let field_name = field['name']
        let field_value = $('#'+field_name).val()
        response_dict['form_elements'][index]['value'] = field_value
        // console.log('updated field', response_dict['form_fields'][index])
    }

    chrome.tabs.query(params, gotTabs)

    function gotTabs(tabs){
        console.log('sendig message');
        console.log('sending form fields ',response_dict['form_elements'])
        msg = {
            txt:"hello there",
            response_dict:response_dict
        }

        chrome.tabs.sendMessage(tabs[0].id, msg, (response_from_content_script) => {
            // response_from_content_script = {errors:[{error_field:'name',error_message:'No error'}]}
            console.log('response from content script', response_from_content_script)
            let errors = response_from_content_script['errors']
            if(errors.length != 0){
                $("#emulation_result").show()
                $("#result_status").text('Failure Occured')
                $("#result_status").addClass('btn btn-block btn-danger')
                console.log('response_from_content_script - ',response_from_content_script)
                let error_list = response_from_content_script.errors
                console.log('response_from_content_script = ',error_list)
                for(index in error_list){
                    let error = error_list[index]
                    console.log('error - ',error)
                    let li_element = `<li class="list-group-item-danger" style="list-style:number">${error['error_field']} threw error - ${error['error_message']}</li>`
                    $("#emulation_ul").append(li_element).show('slow')
                }
            }else{
                $("#emulation_result").removeClass('card list-group-item-danger')
                $("#emulation_result").addClass('btn btn-success btn-block')
                $("#emulation_result").text('Success')
                $("#emulation_result").show()
            }
            
        });
    }
})