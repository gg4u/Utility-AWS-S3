# this function is called by get_signed_request(file) in front-end
# 


'''
Auth routing for S3 assets
'''
@application.route('/api/sign_s3/')
def sign_s3():
    # Load necessary information into the application:
    # S3_BUCKET = os.environ.get('S3_BUCKET')
    AWS_ACCESS_KEY = "yep-access-key-goes-here"
    AWS_SECRET_KEY = "and-here-scrtly-it-goz!@yAhh"
    S3_BUCKET = 'name-of-my-bucket' 

    # Collect information on the file from the GET parameters of the request:
    object_name = urllib.quote_plus(request.args.get('file_name'))
    mime_type = request.args.get('file_type')
    print mime_type

    # Set the expiry time of the signature (in seconds) and declare the permissions of the file to be uploaded
    # expires = int(time.time()+60*60*24)
    # Watch out, if not in USA and AWS is in USA, take care of enough lag time to sync clocks..
    expires = int(time.time()+60*15)
    amz_headers = "x-amz-acl:public-read"
 
    # Generate the StringToSign:
    string_to_sign = "PUT\n\n%s\n%d\n%s\n/%s/%s" % (mime_type, expires, amz_headers, S3_BUCKET, object_name)

    # Generate the signature with which the StringToSign can be signed:
    signature = base64.encodestring(hmac.new(AWS_SECRET_KEY, string_to_sign.encode('utf8'), sha1).digest())
    # Remove surrounding whitespace and quote special characters:
    signature = urllib.quote_plus(signature.strip())

    # Build the URL of the file in anticipation of its imminent upload:
    url = 'https://%s.s3.amazonaws.com/%s' % (S3_BUCKET, object_name)
    
    content = json.dumps({
        'signed_request': '%s?AWSAccessKeyId=%s&Expires=%s&Signature=%s' % (url, AWS_ACCESS_KEY, expires, signature),
        'url': url,
    })
   
    return content
