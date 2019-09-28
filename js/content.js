
console.log('waiting for messages')
var errors =[]

// receiving msgs from a tab
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('got message', request);
        processReceivedMsg(request).then(sendResponse);
        return true; // return true to indicate you wish to send a response asynchronously
});


async function processReceivedMsg(receivedMsg) {
        console.log('process rec called', receivedMsg);

        const P = new Promise(async (res,rej) => {
                console.trace('received message - ', receivedMsg)
                await emulate_form(receivedMsg)
                console.log(`after emulation is done, sendig errors if any = ${errors}`)
                res({errors:errors})
        });
        return P;
}

// async function response_to_background(errors, sendResponse){
//         const p = new Promise((res, rej)=>{
//                 console.log('going to send errors to background')
//                 sendResponse({errors:errors})
//                 res('sent response')
//         })
//         return p;
// }

async function emulate_form(receivedMsg){
        console.log('form fields - ',receivedMsg.response_dict.form_elements)
        async function processField(index) {
                const P = new Promise((res,rej) => {

                        // finding field from form_fields array
                        let field = form_fields[index]
                        console.log(field)

                        // getting xpath of the current field
                        let xpath = field['xpath']
                        console.log('xpath',xpath)
        
                        // getting value of the current field as set in the background script
                        let field_value = field['value']
                        console.log('field value ',field_value)
        
                        // finding the current form field using its xpath on the curent tab page
                        try{
                                let input_node = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                console.log('input_node',input_node)
                                
                                // now filling the values to the inputs
                                // in case of checkbox we just need to click the accessed node
                                if(field['input_type']==="checkbox"){
                                        console.log('clicking checkbox')
                                        input_node.click()
                                        res('done')
                                }else if(field['input_type']==="select"){  // need some delay in case of of select field
                                        console.log('filling the select value ')
                                        // input_node.click()
                                        let node_id = input_node.id
                                        setTimeout(()=>{
                                                let selector = `#${node_id} option`
                                                console.log('selector - ',selector)
                                                $(selector).filter(function() {
                                                        return this.text == field_value;
                                                }).attr('selected', true);
                                                console.log('selected a city')
                                                res('done')
                                        }, 1000)
                                }else{                                  // fill the value in all other cases
                                        input_node.value = field_value
                                        console.log('value set to ',input_node.value)
                                        res('hi deepak')
                                }
        
                        }catch(error){
                                console.log(`appending error ${error.message} to errors list`)
                                errors.push({error_field: field.name, error_message : error.message})     
                                res('done with error')
                        }
                });

                return P;
        }

        let form_fields = receivedMsg.response_dict.form_elements
        console.log('form_fields received = ',form_fields)
        // access dom nodes(form fields) using there xpath, fill there values
        // sunbmit the form, and test the behaviour for errors
        for(let index in form_fields){
                await processField(index);
        }

        async function processSubmitButton(submit_button_xpath){
                console.log('errors - ',errors)
                console.log('submit_button_xpath = ',submit_button_xpath)
                const P = new Promise((res, rej)=>{
                        try{
                                // submit the form after filling all the fields 
                                // access the submit button using submit_button_xpath
                                let submit_button = document.evaluate(submit_button_xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                console.log('submit button is ',submit_button)
                                submit_button.click()
                                console.log('clicked on the submit button')
                                res('clicked submit')
                        }catch(error){
                                console.log(`appending error ${error.message} to errors list`)
                                errors.push({error_field: 'submit button', error_message : error.message})     
                                res('done with error')
                        }
                })
                return P;
        }

        let submit_button_xpath = receivedMsg.response_dict.submit_button_xpath
        await processSubmitButton(submit_button_xpath)
}