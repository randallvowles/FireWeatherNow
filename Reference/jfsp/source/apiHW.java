import java.net.*;
import java.io.*;
import java.util.*;

class HelloWorldApi {
    public static void main() throws Exception {
        
        String stid = "WBB";
        String latestobs = "1";
        String token = "1234567890";
        
        String apiQuery = "stid=" + stid + "&latest_obs=" + latestobs + "&token=" + token;
        
        URL apiRequest = new URL("http://api.mesowest.net/stations?" + apiQuery);
        Scanner scanner = new Scanner(apiRequest.openStream());
        String response = scanner.useDelimiter("\\Z").next();
        JSONObject json = Util.parseJson(response);
        scanner.close();
        System.out.println(json);
    }
}
