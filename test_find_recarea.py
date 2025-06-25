from camply.providers.recreation_dot_gov.recdotgov_provider import RecreationDotGovBase

# Replace with your actual concrete provider if needed
class MyRecDotGovProvider(RecreationDotGovBase):
    @property
    def api_search_result_key(self):
        return "RecAreaID"
    @property
    def activity_name(self):
        return "CAMPING"
    @property
    def api_search_result_class(self):
        from camply.containers.api_responses import RecreationAreaResponse
        return RecreationAreaResponse
    @property
    def facility_type(self):
        return "Campground"
    @property
    def resource_api_path(self):
        from camply.config import RIDBConfig
        return RIDBConfig.REC_AREA_API_PATH
    @property
    def api_base_path(self):
        from camply.config import RIDBConfig
        return RIDBConfig.RIDB_BASE_PATH
    @property
    def api_response_class(self):
        from camply.containers.api_responses import RecreationAreaResponse
        return RecreationAreaResponse
    def paginate_recdotgov_campsites(self, facility_id):
        return []

def test_find_recreation_area_ids(search_string, state=None):
    provider = MyRecDotGovProvider()
    results = provider.find_recreation_areas(search_string=search_string, state=state)
    print(f"Results for '{search_string}':")
    for rec_area in results:
        rec_area_id = rec_area.get("RecAreaID")
        rec_area_name = rec_area.get("RecAreaName")
        print(f"  RecAreaID: {rec_area_id}, Name: {rec_area_name}")

if __name__ == "__main__":
    test_find_recreation_area_ids("Yosemite")
    test_find_recreation_area_ids("Grand Canyon")
    test_find_recreation_area_ids("North cascades national park")
