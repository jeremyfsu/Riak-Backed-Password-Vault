function find() {
    client = new RiakClient();
    client.bucket('passwords', function(b){get_object(b);});
}

function save(){
    client = new RiakClient();
    client.bucket('passwords', function(b){get_or_new_object(b);});
    $('#errors').text('Password stored');
}

function get_or_new_object(bucket){
    bucket.get_or_new($('input#key').val(), function(status, o){save_object(o);});
}

function save_object(object){
    encrypted = GibberishAES.enc($('input#value').val(), $('input#secret').val());
    object.body = encrypted;
    object.contentType = 'text/plain';
    object.store();
    $('input#value').val(encrypted);
}

function get_object(bucket){
    bucket.get($('input#key').val(), function(s,o){get_value(o);});
}

function get_value(object){
    try {
        decrypted = GibberishAES.dec(object.body, $('input#secret').val());
        $('input#value').val(decrypted);
        $('#errors').text("");
    }
    catch(e) {
        $('#errors').text("Error decrypting, passphrase may be incorrect");
        $('input#value').val("");
    }
}
function list_keys(){
    client = new RiakClient();
    var bucket = new RiakBucket(name, client);
    bucket.keys(function(keys){
        $('#errors').text(keys);
    });

}